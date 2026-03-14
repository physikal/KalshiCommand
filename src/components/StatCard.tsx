interface StatCardProps {
  label: string;
  value: string;
  subvalue?: string;
  trend?: "up" | "down" | "neutral";
}

export default function StatCard({
  label,
  value,
  subvalue,
  trend,
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-gain"
      : trend === "down"
        ? "text-loss"
        : "text-surface-200";

  return (
    <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 md:p-5">
      <p className="text-xs text-surface-200 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-2xl md:text-3xl font-bold tracking-tight ${trendColor}`}>
        {value}
      </p>
      {subvalue && (
        <p className="text-xs text-surface-700 mt-1">{subvalue}</p>
      )}
    </div>
  );
}
