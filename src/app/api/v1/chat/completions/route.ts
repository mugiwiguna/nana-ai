import { NextResponse } from "next/server";
import { validateApiKey, calculateCost, deductBalance } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Auth via Bearer token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: { message: "Missing API key", type: "auth_error" } }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    const user = await validateApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: { message: "Invalid or inactive API key", type: "auth_error" } }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json();
    const model = body.model || "gpt-3.5-turbo";

    // 3. Check balance
    if (Number(user.balance) <= 0) {
      return NextResponse.json({ error: { message: "Insufficient balance", type: "insufficient_quota" } }, { status: 402 });
    }

    // 4. Proxy to upstream
    const upstreamRes = await fetch(`${process.env.UPSTREAM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.UPSTREAM_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!upstreamRes.ok) {
      const errBody = await upstreamRes.text();
      return NextResponse.json(
        { error: { message: "Upstream error", upstream: errBody } },
        { status: upstreamRes.status }
      );
    }

    // 5. Parse upstream response
    const data = await upstreamRes.json();

    const tokensIn = data.usage?.prompt_tokens || 0;
    const tokensOut = data.usage?.completion_tokens || 0;
    const cost = calculateCost(model, tokensIn, tokensOut);

    // 6. Deduct & log
    if (cost > 0) {
      await deductBalance(user.id, user.api_key_id, model, tokensIn, tokensOut, cost);
    }

    // Add usage info to response
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
