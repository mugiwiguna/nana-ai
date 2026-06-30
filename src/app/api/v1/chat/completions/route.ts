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
    const isStream = body.stream === true;

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
      upstreamBaseUrl = customRoute.baseUrl;
      upstreamApiKey = customRoute.apiKey;
      upstreamBody = { ...body, model: customRoute.upstreamModel };
      useCustomPricing = { input: customRoute.inputPrice, output: customRoute.outputPrice };
    } else {
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

    // Request usage info in stream if supported
    if (isStream) {
      upstreamBody.stream_options = { include_usage: true };
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

    // ── Streaming response ──
    if (isStream && upstreamRes.body) {
      const stream = upstreamRes.body;
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let tokensIn = 0;
      let tokensOut = 0;
      let usageFound = false;
      let completionContent = "";

      const proxy = new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            // Stream ended — estimate tokens if upstream didn't send usage
            if (!usageFound && tokensIn === 0 && tokensOut === 0) {
              // Rough estimate: ~4 chars per token
              tokensIn = Math.ceil(JSON.stringify(upstreamBody.messages || []).length / 4);
              tokensOut = Math.ceil(completionContent.length / 4);
            }

            // Deduct balance async (don't block the response)
            const cost = useCustomPricing
              ? tokensIn * useCustomPricing.input + tokensOut * useCustomPricing.output
              : calculateCost(model, tokensIn, tokensOut);
            deductBalance(user.id, user.api_key_id, model, tokensIn, tokensOut, cost).catch(() => {});

            controller.close();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Parse SSE lines for usage extraction
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                // Accumulate content for token estimation
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) completionContent += delta;
                // Extract usage if present (final chunk)
                if (parsed.usage) {
                  tokensIn = parsed.usage.prompt_tokens || 0;
                  tokensOut = parsed.usage.completion_tokens || 0;
                  usageFound = true;
                }
              } catch {}
            }
          }

          controller.enqueue(value);
        },
      });

      return new Response(proxy, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // ── Non-streaming response ──
    const data = await upstreamRes.json();

    const tokensIn = data.usage?.prompt_tokens || 0;
    const tokensOut = data.usage?.completion_tokens || 0;

    const cost = useCustomPricing
      ? tokensIn * useCustomPricing.input + tokensOut * useCustomPricing.output
      : calculateCost(model, tokensIn, tokensOut);

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
