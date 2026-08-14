import { NextRequest } from "next/server";
import OpenAI from "openai";
import { BudgetGuard, BudgetExceeded } from "floe-guard";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// One guard per active call, keyed by Vapi's call ID.
// In-memory Map is fine for local/dev testing. For production on Vercel,
// this needs to move to Supabase or Redis since serverless instances don't
// share memory across invocations.
const callGuards = new Map<string, BudgetGuard>();

const PER_CALL_BUDGET_USD = 0.5; // adjust as needed

function getGuardForCall(callId: string) {
  if (!callGuards.has(callId)) {
    callGuards.set(callId, new BudgetGuard(PER_CALL_BUDGET_USD));
  }
  return callGuards.get(callId)!;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Vapi sends the call context in the request; exact shape may vary
  // slightly by Vapi version, so log body once during testing to confirm.
  const callId: string = body?.call?.id ?? "unknown-call";
  const messages = body?.messages ?? [];

  const guard = getGuardForCall(callId);

  try {
    guard.check(); // throws BudgetExceeded if the next call would cross budget
  } catch (err) {
    if (err instanceof BudgetExceeded) {
      // Return a graceful, in-character message instead of erroring out,
      // so the caller hears something sensible rather than dead air.
      return new Response(
        streamSingleMessage(
          "I'm sorry, I need to transfer you to a team member who can help further."
        ),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }
    throw err;
  }

  // Call OpenAI with streaming enabled
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  let promptTokensEstimate = 0;
  let completionTokensEstimate = 0;

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content ?? "";
        if (content) {
          completionTokensEstimate += Math.ceil(content.length / 4); // rough estimate
          const sseChunk = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(sseChunk));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();

      // Record actual/estimated usage after the stream completes.
      // Swap in real usage numbers if/when OpenAI's streaming response
      // includes a final usage object for your SDK version.
      guard.record("gpt-4o-mini", promptTokensEstimate, completionTokensEstimate);
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function streamSingleMessage(text: string): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      const fakeChunk = {
        id: "budget-block",
        choices: [{ delta: { content: text }, index: 0, finish_reason: null }],
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(fakeChunk)}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}
