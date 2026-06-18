import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const normalized =
    status.includes("逾期") || status.includes("风险") || status.includes("不够满意") || status.includes("严重不满")
      ? "danger"
      : status.includes("充分") || status.includes("完成") || status.includes("启用") || status.includes("已续费") || status.includes("信任支持")
        ? "success"
        : status.includes("价值无感") || status.includes("未开始") || status.includes("未续费")
          ? "warning"
          : "neutral";

  return (
    <span className={`status status-${normalized}`}>
      {normalized === "danger" ? <AlertTriangle size={13} /> : normalized === "success" ? <CheckCircle2 size={13} /> : null}
      {status}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  return <span className={`risk risk-${risk}`}>{risk}</span>;
}
