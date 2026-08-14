// Helpers for talking to the Vapi API and building the receptionist brain.

const VAPI = "https://api.vapi.ai";

export function buildSystemPrompt(a: {
  business_name?: string | null;
  knowledge?: string | null;
}) {
  return `You are a friendly, professional phone receptionist for ${a.business_name || "this business"}.

Your job on every call:
1. Greet the caller warmly and ask how you can help.
2. Answer questions using ONLY the business information below. If you don't know, say you'll have someone follow up — never make things up.
3. Always collect the caller's full name, phone number, and reason for calling before the call ends.
4. Keep replies short and conversational — this is a phone call, not an essay.
5. If the caller is upset or it's an emergency, apologize, take their details, and promise a same-day callback.

BUSINESS INFORMATION:
${a.knowledge || "(none provided yet)"}`;
}

export async function upsertVapiAssistant(agent: {
  vapi_assistant_id?: string | null;
  name: string;
  business_name?: string | null;
  greeting?: string | null;
  voice?: string | null;
  knowledge?: string | null;
}, serverUrl: string) {
  const body = {
    name: `${agent.business_name || agent.name} Receptionist`,
    firstMessage:
      agent.greeting ||
      `Thank you for calling ${agent.business_name || "us"}! How can I help you today?`,
    model: {
      provider: "custom-llm",
      url: `${process.env.VAPI_LLM_URL}/api/vapi/llm`,
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: buildSystemPrompt(agent) }]
    },
    voice: { provider: "playht", voiceId: agent.voice || "jennifer" },
    transcriber: { provider: "deepgram", model: "nova-2", language: "en" },
    server: { url: serverUrl, secret: process.env.VAPI_WEBHOOK_SECRET },
    analysisPlan: {
      summaryPlan: { enabled: true },
      structuredDataPlan: {
        enabled: true,
        schema: {
          type: "object",
          properties: {
            caller_name: { type: "string", description: "Caller's full name" },
            caller_phone: { type: "string", description: "Caller's phone number" },
            caller_email: { type: "string", description: "Caller's email if given" },
            reason: { type: "string", description: "Why they called" }
          }
        }
      }
    }
  };

  const isUpdate = !!agent.vapi_assistant_id;
  const res = await fetch(
    isUpdate ? `${VAPI}/assistant/${agent.vapi_assistant_id}` : `${VAPI}/assistant`,
    {
      method: isUpdate ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) throw new Error(`Vapi error ${res.status}: ${await res.text()}`);
  return res.json();
}
