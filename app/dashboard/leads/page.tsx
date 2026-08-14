import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Leads() {
  const supabase = supabaseServer();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, phone, email, reason, call_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Leads</h1>
      <div className="card divide-y divide-edge">
        {(leads ?? []).length === 0 && (
          <p className="p-5 text-sm text-dim">No leads yet. When a caller leaves their details, they appear here.</p>
        )}
        {(leads ?? []).map((l) => (
          <div key={l.id} className="p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{l.name || "Unnamed caller"}</p>
              <p className="text-xs text-cyan">{[l.phone, l.email].filter(Boolean).join(" · ") || "No contact info"}</p>
              {l.reason && <p className="text-xs text-dim mt-1">{l.reason}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-dim">{new Date(l.created_at).toLocaleDateString()}</p>
              {l.call_id && <Link href={`/dashboard/calls/${l.call_id}`} className="text-xs text-cyan underline">View call</Link>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
