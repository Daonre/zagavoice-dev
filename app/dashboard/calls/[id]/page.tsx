import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function CallDetail({ params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { data: call } = await supabase.from("calls").select("*").eq("id", params.id).single();
  if (!call) notFound();

  const { data: lead } = await supabase.from("leads").select("*").eq("call_id", call.id).maybeSingle();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold mb-1">{call.caller_number || "Unknown caller"}</h1>
      <p className="text-sm text-dim mb-6">
        {new Date(call.created_at).toLocaleString()} · {Math.floor((call.duration_seconds || 0) / 60)}m {(call.duration_seconds || 0) % 60}s
        {call.ended_reason ? ` · ${call.ended_reason}` : ""}
      </p>

      {call.recording_url && (
        <div className="card p-4 mb-6">
          <p className="label">Recording</p>
          <audio controls src={call.recording_url} className="w-full" />
        </div>
      )}

      {call.summary && (
        <div className="card p-4 mb-6">
          <p className="label">Summary</p>
          <p className="text-sm leading-relaxed">{call.summary}</p>
        </div>
      )}

      {lead && (
        <div className="card p-4 mb-6 border-lime/40">
          <p className="label text-lime">Lead captured</p>
          <p className="text-sm">{lead.name || "—"} · {lead.phone || "—"} {lead.email ? `· ${lead.email}` : ""}</p>
          {lead.reason && <p className="text-sm text-dim mt-1">{lead.reason}</p>}
        </div>
      )}

      <div className="card p-4">
        <p className="label">Transcript</p>
        <pre className="text-sm whitespace-pre-wrap font-body leading-relaxed text-white/90">
          {call.transcript || "No transcript available."}
        </pre>
      </div>
    </div>
  );
}
