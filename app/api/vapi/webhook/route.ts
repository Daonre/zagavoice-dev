import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Vapi calls this URL when things happen on a call.
// We care about "end-of-call-report": it carries the transcript,
// summary, recording, and the structured lead data.

export async function POST(req: NextRequest) {
  // Verify the request really came from Vapi
  const secret = req.headers.get("x-vapi-secret");
  if (!secret || secret !== process.env.VAPI_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  const message = payload?.message;
  if (message?.type !== "end-of-call-report") {
    return NextResponse.json({ ok: true }); // ignore other event types
  }

  const db = supabaseAdmin();
  const assistantId = message?.call?.assistantId || message?.assistant?.id;

  // Find which client (org) this assistant belongs to
  const { data: agent } = await db
    .from("agents")
    .select("id, org_id")
    .eq("vapi_assistant_id", assistantId)
    .single();

  if (!agent) return NextResponse.json({ ok: true }); // unknown assistant, ignore

  const startedAt = message.startedAt ? new Date(message.startedAt) : null;
  const endedAt = message.endedAt ? new Date(message.endedAt) : null;
  const duration =
    startedAt && endedAt ? Math.round((endedAt.getTime() - startedAt.getTime()) / 1000) : 0;

  const { data: call, error } = await db
    .from("calls")
    .upsert(
      {
        org_id: agent.org_id,
        agent_id: agent.id,
        vapi_call_id: message?.call?.id,
        caller_number: message?.call?.customer?.number || null,
        started_at: startedAt?.toISOString() || null,
        ended_at: endedAt?.toISOString() || null,
        duration_seconds: duration,
        ended_reason: message.endedReason || null,
        summary: message?.analysis?.summary || message?.summary || null,
        transcript: message.transcript || null,
        recording_url: message.recordingUrl || message?.artifact?.recordingUrl || null
      },
      { onConflict: "vapi_call_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("call insert failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Lead capture from Vapi's structured data analysis
  const sd = message?.analysis?.structuredData;
  if (sd && (sd.caller_name || sd.caller_phone || sd.caller_email)) {
    await db.from("leads").insert({
      org_id: agent.org_id,
      call_id: call.id,
      name: sd.caller_name || null,
      phone: sd.caller_phone || message?.call?.customer?.number || null,
      email: sd.caller_email || null,
      reason: sd.reason || null
    });
  }

  return NextResponse.json({ ok: true });
}
