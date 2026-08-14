import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Calls() {
  const supabase = supabaseServer();
  const { data: calls } = await supabase
    .from("calls")
    .select("id, caller_number, duration_seconds, summary, ended_reason, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Calls</h1>
      <div className="card divide-y divide-edge">
        {(calls ?? []).length === 0 && <p className="p-5 text-sm text-dim">No calls yet.</p>}
        {(calls ?? []).map((c) => (
          <Link key={c.id} href={`/dashboard/calls/${c.id}`} className="flex items-center justify-between p-4 hover:bg-ink/50 transition">
            <div className="min-w-0">
              <p className="text-sm font-medium">{c.caller_number || "Unknown caller"}</p>
              <p className="text-xs text-dim line-clamp-1">{c.summary || c.ended_reason || "—"}</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-xs text-cyan">{Math.floor((c.duration_seconds || 0) / 60)}m {(c.duration_seconds || 0) % 60}s</p>
              <p className="text-xs text-dim">{new Date(c.created_at).toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
