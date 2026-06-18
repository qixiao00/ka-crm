export function Metric({
  title,
  value,
  helper,
  tone,
  compact = false,
}: {
  title: string;
  value: string;
  helper: string;
  tone: "green" | "amber" | "coral" | "blue";
  compact?: boolean;
}) {
  return (
    <div className={`metric metric-${tone} ${compact ? "metric-compact" : ""}`}>
      <p className="muted-text text-sm font-medium">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="muted-text mt-2 text-sm">{helper}</p>
    </div>
  );
}
