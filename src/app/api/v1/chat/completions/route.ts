import { NextResponse } from "next/server";
import { validateApiKey, calculateCost, deductBalance, getCustomModelRoute } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: { message: "Missing API key", type: "auth_error" } }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    const user = await validateApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: { message: "Invalid or inactive API key", type: "auth_error" } }, { status: 401 });
    }

    const body = await req.json();
    const model = body.model || "gpt-3.5-turbo";

    if (Number(user.balance) <= 0) {
      return NextResponse.json({ error: { message: "Insufficient balance", type: "insufficient_quota" } }, { status: 402 });
    }

    // Determine upstream target
    const customRoute = await getCustomModelRoute(model);

    let upstreamBaseUrl: string;
    let upstreamApiKey: string;
    let upstreamBody: any;
    let useCustomPricing: { input: number; output: number } | null = null;

    if (customRoute) {
      // Custom model -> route to its provider
      upstreamBaseUrl = customRoute.baseUrl;
      upstreamApiKey = customRoute.apiKey;
      upstreamBody = { ...body, model: customRoute.upstreamModel };
      useCustomPricing = { input: customRoute.inputPrice, output: customRoute.outputPrice };
    } else {
      // Built-in model -> route to default upstream
      upstreamBaseUrl = process.env.UPSTREAM_BASE_URL || "";
      upstreamApiKey = process.env.UPSTREAM_API_KEY || "";
      upstreamBody = body;
    }

    if (!upstreamBaseUrl || !upstreamApiKey) {
      return NextResponse.json(
        { error: { message: "No upstream configured for this model", type: "config_error" } },
        { status: 503 }
      );
    }

    const upstreamRes = await fetch(`${upstreamBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${upstreamApiKey}`,
      },
      body: JSON.stringify(upstreamBody),
    });

    if (!upstreamRes.ok) {
      const errBody = await upstreamRes.text();
      return NextResponse.json(
        { error: { message: "Upstream error", upstream: errBody } },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();

    const tokensIn = data.usage?.prompt_tokens || 0;
    const tokensOut = data.usage?.completion_tokens || 0;

    // Use custom pricing if available, else fallback to built-in
    let cost: number;
    if (useCustomPricing) {
      cost = tokensIn * useCustomPricing.input + tokensOut * useCustomPricing.output;
    } else {
      cost = calculateCost(model, tokensIn, tokensOut);
    }

    // Always log usage; balance deducted even if cost=0 (records the request)
    await deductBalance(user.id, user.api_key_id, model, tokensIn, tokensOut, cost);

    return NextResponse.json({
      ...data,
      usage: {
        ...data.usage,
        cost,
        remaining_balance: Math.max(0, Number(user.balance) - cost),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: { message: e.message || "Internal error", type: "server_error" } },
      { status: 500 }
    );
  }
}
