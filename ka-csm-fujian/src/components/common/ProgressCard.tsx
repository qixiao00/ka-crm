export function ProgressCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#334155]">{label}</p>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
