"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const VOICES = [
  { id: "jennifer", label: "Jennifer — warm, professional (female)" },
  { id: "melissa", label: "Melissa — friendly, upbeat (female)" },
  { id: "will", label: "Will — calm, confident (male)" },
  { id: "chris", label: "Chris — energetic (male)" }
];

export default function AgentSetup() {
  const supabase = supabaseBrowser();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [voice, setVoice] = useState("jennifer");
  const [knowledge, setKnowledge] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("agents").select("*").limit(1).maybeSingle().then(({ data }) => {
      if (!data) return;
      setAgentId(data.id);
      setAssistantId(data.vapi_assistant_id);
      setBusinessName(data.business_name || "");
      setGreeting(data.greeting || "");
      setVoice(data.voice || "jennifer");
      setKnowledge(data.knowledge || "");
      setPhone(data.phone_number || "");
    });
  }, []);

  async function save() {
    setBusy(true); setMsg("");
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: agentId,
        business_name: businessName,
        greeting, voice, knowledge,
        phone_number: phone
      })
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(json.error || "Something went wrong."); return; }
    setAgentId(json.id);
    setAssistantId(json.vapi_assistant_id);
    setMsg("Saved. Your receptionist is updated.");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-1">Agent setup</h1>
      <p className="text-sm text-dim mb-8">
        This is your receptionist&apos;s brain. Update anything here and it changes on the next call.
      </p>

      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Business name</label>
          <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Plumbing" />
        </div>
        <div>
          <label className="label">Greeting (first thing callers hear)</label>
          <input className="input" value={greeting} onChange={(e) => setGreeting(e.target.value)}
            placeholder="Thank you for calling Acme Plumbing! How can I help you today?" />
        </div>
        <div>
          <label className="label">Voice</label>
          <select className="input" value={voice} onChange={(e) => setVoice(e.target.value)}>
            {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Business knowledge (hours, services, pricing, FAQs)</label>
          <textarea className="input min-h-44" value={knowledge} onChange={(e) => setKnowledge(e.target.value)}
            placeholder={"Hours: Mon–Fri 8am–6pm\nServices: drain cleaning ($150+), water heaters, emergency repair\nService area: Edison, Woodbridge, Metuchen\nEmergencies: take details, promise callback within 1 hour"} />
        </div>
        <div>
          <label className="label">Phone number attached in Vapi (for your reference)</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (732) 555-0123" />
        </div>

        {msg && <p className={`text-sm ${msg.startsWith("Saved") ? "text-lime" : "text-coral"}`}>{msg}</p>}

        <button className="btn" onClick={save} disabled={busy || !businessName}>
          {busy ? "Saving…" : assistantId ? "Update receptionist" : "Create receptionist"}
        </button>

        {assistantId && (
          <p className="text-xs text-dim">
            Vapi assistant ID: <span className="text-cyan">{assistantId}</span> — attach your phone number to this
            assistant in the Vapi dashboard (Phone Numbers → select number → Assistant).
          </p>
        )}
      </div>
    </div>
  );
}
