export function EmptyState({ text = "当前筛选条件下暂无数据" }: { text?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#b9d7ff] bg-[#f7fbff]/80 p-8 text-center text-sm font-semibold text-[#64748b]">
      {text}
    </div>
  );
}
