"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [business, setBusiness] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError("");
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email, password,
            options: { data: { business_name: business } }
          });
    setBusy(false);
    if (result.error) { setError(result.error.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="pulse h-2.5 w-2.5 rounded-full bg-lime" />
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Zaga<span className="text-cyan">Voice</span>
          </h1>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold mb-4">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h2>
          {mode === "signup" && (
            <div className="mb-3">
              <label className="label">Business name</label>
              <input className="input" value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Acme Plumbing" />
            </div>
          )}
          <div className="mb-3">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
          </div>
          <div className="mb-4">
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-coral text-sm mb-3">{error}</p>}
          <button className="btn w-full" onClick={submit} disabled={busy}>
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </div>
        <button
          className="mt-4 text-sm text-dim hover:text-white transition"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
