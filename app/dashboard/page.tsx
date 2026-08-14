import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";

function fmtDur(s: number) {
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export default async function Overview() {
  const supabase = supabaseServer();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [{ count: totalCalls }, { count: weekCalls }, { count: totalLeads }, { data: recent }, { data: agent }] =
    await Promise.all([
      supabase.from("calls").select("*", { count: "exact", head: true }),
      supabase.from("calls").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("calls").select("id, caller_number, duration_seconds, summary, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("agents").select("id, business_name, phone_number, vapi_assistant_id").limit(1).maybeSingle()
    ]);

  const live = !!agent?.vapi_assistant_id && !!agent?.phone_number;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold">Overview</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${live ? "bg-lime pulse" : "bg-coral"}`} />
          <span className="text-dim">{live ? "Receptionist live" : "Not live yet"}</span>
        </div>
      </div>

      {!agent?.vapi_assistant_id && (
        <div className="card p-5 mb-6 border-cyan/40">
          <p className="text-sm">
            Your receptionist isn&apos;t set up yet.{" "}
            <Link href="/dashboard/agent" className="text-cyan underline">Set up your agent →</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Calls this week" value={String(weekCalls ?? 0)} />
        <StatCard label="Total calls" value={String(totalCalls ?? 0)} />
        <StatCard label="Leads captured" value={String(totalLeads ?? 0)} accent="lime" />
      </div>

      <h2 className="font-display text-lg font-semibold mb-3">Recent calls</h2>
      <div className="card divide-y divide-edge">
        {(recent ?? []).length === 0 && (
          <p className="p-5 text-sm text-dim">No calls yet. Once your number is live, every call lands here automatically.</p>
        )}
        {(recent ?? []).map((c) => (
          <Link key={c.id} href={`/dashboard/calls/${c.id}`} className="flex items-center justify-between p-4 hover:bg-ink/50 transition">
            <div>
              <p className="text-sm font-medium">{c.caller_number || "Unknown caller"}</p>
              <p className="text-xs text-dim line-clamp-1">{c.summary || "No summary"}</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-xs text-cyan">{fmtDur(c.duration_seconds || 0)}</p>
              <p className="text-xs text-dim">{new Date(c.created_at).toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
