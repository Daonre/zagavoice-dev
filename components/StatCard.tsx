export default function StatCard({ label, value, accent }: { label: string; value: string; accent?: "cyan" | "lime" | "coral" }) {
  const color = accent === "lime" ? "text-lime" : accent === "coral" ? "text-coral" : "text-cyan";
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-widest text-dim mb-2">{label}</p>
      <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
