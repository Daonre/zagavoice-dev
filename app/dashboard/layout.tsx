import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import SignOut from "@/components/SignOut";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/calls", label: "Calls" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/agent", label: "Agent setup" }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("org_id, orgs(name)").eq("id", user.id).single();
  const orgName = (profile as any)?.orgs?.name || "My Business";

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-edge p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <span className="pulse h-2 w-2 rounded-full bg-lime" />
          <span className="font-display font-bold">Zaga<span className="text-cyan">Voice</span></span>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
              className="px-3 py-2 rounded-lg text-sm text-dim hover:text-white hover:bg-panel transition">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-edge">
          <p className="text-xs text-dim truncate mb-2">{orgName}</p>
          <SignOut />
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-6xl">{children}</main>
    </div>
  );
}
