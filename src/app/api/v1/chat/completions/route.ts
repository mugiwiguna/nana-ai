import { NextResponse } from "next/server";
import { validateApiKey, calculateCost, deductBalance, getCustomModelRoute, checkFreeTier, logFreeUsage, checkTokenLimits, checkFreeTierUsage } from "@/lib/billing";

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

    // Determine upstream target
    const customRoute = await getCustomModelRoute(model);

    // Check free tier eligibility
    const freeTier = await checkFreeTier(user.id, model);

    // Check free tier limits FIRST (for free models) — applies to ALL users
    if (freeTier.eligible) {
      const freeLimits = await checkFreeTierUsage(user.id);
      if (!freeLimits.allowed) {
        const exceeded: string[] = [];
        const l = freeLimits.limits;
        if (l.daily.limit && l.daily.remaining === 0) exceeded.push(`daily: ${l.daily.used.toLocaleString()}/${l.daily.limit.toLocaleString()}`);
        if (l.weekly.limit && l.weekly.remaining === 0) exceeded.push(`weekly: ${l.weekly.used.toLocaleString()}/${l.weekly.limit.toLocaleString()}`);
        if (l.monthly.limit && l.monthly.remaining === 0) exceeded.push(`monthly: ${l.monthly.used.toLocaleString()}/${l.monthly.limit.toLocaleString()}`);
        return NextResponse.json({
          error: {
            message: `Free tier limit reached (${exceeded.join(", ")}). Upgrade plan atau tunggu reset berikutnya.`,
            type: "rate_limit_error",
            limits: l,
          },
        }, { status: 429 });
      }
    }

    // Check paid plan token limits (daily/weekly/monthly) — for paid users or as fallback
    const tokenLimits = await checkTokenLimits(user.id);
    if (!tokenLimits.allowed) {
      const exceeded: string[] = [];
      const l = tokenLimits.limits;
      if (l.daily.limit && l.daily.remaining === 0) exceeded.push(`daily: ${l.daily.used.toLocaleString()}/${l.daily.limit.toLocaleString()}`);
      if (l.weekly.limit && l.weekly.remaining === 0) exceeded.push(`weekly: ${l.weekly.used.toLocaleString()}/${l.weekly.limit.toLocaleString()}`);
      if (l.monthly.limit && l.monthly.remaining === 0) exceeded.push(`monthly: ${l.monthly.used.toLocaleString()}/${l.monthly.limit.toLocaleString()}`);
      return NextResponse.json({
        error: {
          message: `Token limit reached (${exceeded.join(", ")}). Upgrade plan atau tunggu reset berikutnya.`,
          type: "rate_limit_error",
          limits: l,
        },
      }, { status: 429 });
    }

    if (!freeTier.eligible && Number(user.balance) <= 0) {
      return NextResponse.json({ error: { message: "Insufficient balance", type: "insufficient_quota" } }, { status: 402 });
    }

    let upstreamBaseUrl: string;
    let upstreamApiKey: string;
    let upstreamBody: any;
    let useCustomPricing: { input: number; output: number } | null = null;
    let isReasoningModel = false;

    if (customRoute) {
      upstreamBaseUrl = customRoute.baseUrl;
      upstreamApiKey = customRoute.apiKey;
      upstreamBody = { ...body, model: customRoute.upstreamModel };
      useCustomPricing = { input: customRoute.inputPrice, output: customRoute.outputPrice };
      isReasoningModel = customRoute.isReasoning;
      // Reasoning models need higher max_tokens — enforce minimum 1024
      if (isReasoningModel && (!body.max_tokens || body.max_tokens < 1024)) {
        upstreamBody.max_tokens = Math.max(body.max_tokens || 0, 1024);
      }
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

            // Deduct balance or log free usage
            if (freeTier.eligible) {
              logFreeUsage(user.id, user.api_key_id, model, tokensIn, tokensOut).catch(() => {});
            } else {
              const cost = useCustomPricing
                ? tokensIn * useCustomPricing.input + tokensOut * useCustomPricing.output
                : calculateCost(model, tokensIn, tokensOut);
              deductBalance(user.id, user.api_key_id, model, tokensIn, tokensOut, cost).catch(() => {});
            }

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
    const rawText = await upstreamRes.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      // Upstream returned SSE instead of JSON — parse the last data: chunk
      const lines = rawText.split('\n').filter(l => l.startsWith('data: ') && !l.includes('[DONE]'));
      const last = lines[lines.length - 1];
      if (last) {
        data = JSON.parse(last.replace('data: ', ''));
      } else {
        return NextResponse.json({ error: { message: 'Invalid upstream response' } }, { status: 502 });
      }
    }

    const tokensIn = data.usage?.prompt_tokens || 0;
    const tokensOut = data.usage?.completion_tokens || 0;

    if (freeTier.eligible) {
      await logFreeUsage(user.id, user.api_key_id, model, tokensIn, tokensOut);
      return NextResponse.json({
        ...data,
        usage: {
          ...data.usage,
          cost: 0,
          free_tier: true,
          remaining_balance: Number(user.balance),
        },
      });
    }

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
