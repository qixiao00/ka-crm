import { Activity, CircleDollarSign, ShieldAlert, Sparkles, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { Metric } from "@/components/common/Metric";
import { Panel } from "@/components/common/Panel";
import { ProgressCard } from "@/components/common/ProgressCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { AppData } from "@/lib/app-data";
import type { Contact, Customer, KeyScenario, Project, ServiceRenewal, WeeklyTask } from "@/lib/data";

type Tone = "green" | "amber" | "coral" | "blue";

const trustPositive = new Set(["充分信赖", "信任支持"]);
const riskBadWords = ["不可控", "修复中", "未闭环", "有风险"];

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countBy<T>(items: T[], getValue: (item: T) => string) {
  return items.reduce<Record<string, number>>((result, item) => {
    const value = getValue(item).trim() || "未填写";
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

function sumRenewal(renewals: ServiceRenewal[], field: "renewalTarget" | "renewedOrderAmount") {
  return renewals.reduce((sum, renewal) => sum + (Number(renewal[field]) || 0), 0);
}

function isRisky(value: string) {
  return riskBadWords.some((keyword) => value.includes(keyword)) && !value.includes("已闭环");
}

function DistributionBar({ title, data, total, toneFor }: { title: string; data: Record<string, number>; total: number; toneFor: (label: string) => Tone }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  return (
    <div className="dashboard-chart-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#172554]">{title}</h3>
        <span className="muted-text text-xs">{total} 条</span>
      </div>
      <div className="space-y-3">
        {entries.map(([label, count]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-[#334155]">{label}</span>
              <strong>{count}</strong>
            </div>
            <div className="viz-track">
              <div className={`viz-bar viz-${toneFor(label)}`} style={{ width: `${percent(count, total)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalTile({ icon, label, value, helper, tone }: { icon: ReactNode; label: string; value: string; helper: string; tone: Tone }) {
  return (
    <div className={`signal-tile signal-${tone}`}>
      <div className="signal-icon">{icon}</div>
      <div>
        <p className="muted-text text-sm font-bold">{label}</p>
        <p className="mt-1 text-2xl font-black text-[#0f172a]">{value}</p>
        <p className="muted-text mt-1 text-xs">{helper}</p>
      </div>
    </div>
  );
}

export function DashboardView({
  customers,
  contacts,
  keyScenarios,
  projects,
  serviceRenewals,
  weeklyTasks,
  summary,
}: {
  customers: Customer[];
  contacts: Contact[];
  keyScenarios: KeyScenario[];
  projects: Project[];
  serviceRenewals: ServiceRenewal[];
  weeklyTasks: WeeklyTask[];
  summary: AppData["summary"];
}) {
  const highRisk = customers.filter((customer) => String(customer.risk).includes("高")).length;
  const customerNamesWithPlan = new Set(keyScenarios.map((scenario) => scenario.customer).filter(Boolean));
  const planRate = percent(customerNamesWithPlan.size, customers.length);

  const valueRows = keyScenarios.filter((scenario) => scenario.businessValueRealization);
  const scenarioRate = percent(valueRows.filter((scenario) => scenario.businessValueRealization === "价值充分兑现").length, valueRows.length);

  const alignedRows = keyScenarios.filter((scenario) => scenario.businessValueGoal || scenario.slaGoal);
  const alignmentRate = percent(
    alignedRows.filter((scenario) => scenario.businessValueGoal === "目标明确" || scenario.slaGoal === "目标明确").length,
    alignedRows.length,
  );

  const keyPersonRows = keyScenarios.filter((scenario) => scenario.keyPerson.trim());
  const keyPersonTrustRate = percent(keyScenarios.filter((scenario) => trustPositive.has(scenario.keyPersonRecognition || scenario.satisfactionCurrent)).length, keyScenarios.length);
  const severeUnsatisfied = keyScenarios.filter((scenario) =>
    [scenario.satisfactionCurrent, scenario.quarterlyGoal, scenario.keyPersonRecognition].some((value) => value === "严重不满"),
  ).length;

  const satisfactionData = countBy(keyScenarios, (scenario) => scenario.satisfactionCurrent);
  const planRiskData = countBy(keyScenarios, (scenario) => scenario.satisfactionRisk);

  const projectRiskData = countBy(projects, (project) => project.satisfactionRisk);
  const projectRiskCount = projects.filter((project) => isRisky(project.satisfactionRisk)).length;

  const renewalTarget = sumRenewal(serviceRenewals, "renewalTarget");
  const renewedOrderAmount = sumRenewal(serviceRenewals, "renewedOrderAmount");
  const renewalCompletion = renewalTarget ? clamp((renewedOrderAmount / renewalTarget) * 100) : 0;

  return (
    <section className="space-y-5">
      <div className="metric-grid">
        <Metric title="KA客户数" value={`${customers.length}`} helper={`可见客户池 ${summary.totalCustomers} 家`} tone="green" />
        <Metric title="预计总收入" value={`${renewalTarget.toLocaleString()} W`} helper="服务续费管理中的续费目标" tone="amber" />
        <Metric title="高风险客户" value={`${highRisk}`} helper="来自客户清单风险等级" tone="coral" />
        <Metric title="成功计划完成率" value={`${planRate}%`} helper={`${customerNamesWithPlan.size} / ${customers.length} 个客户已建计划`} tone="blue" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel title="客户成功" subtitle="结果指标与过程指标">
          <div className="grid gap-4 sm:grid-cols-3">
            <ProgressCard label="计划制定完成率" value={planRate} />
            <ProgressCard label="场景价值兑现率" value={scenarioRate} />
            <ProgressCard label="客户目标对齐率" value={alignmentRate} />
          </div>
        </Panel>
        <Panel title="组织关系" subtitle="关键人认可和满意度">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric title="关键人数" value={`${keyPersonRows.length || contacts.length}`} helper="成功计划中维护的关键人" tone="green" compact />
            <Metric title="关键人认可率" value={`${keyPersonTrustRate}%`} helper="充分信赖 + 信任支持" tone="amber" compact />
            <Metric title="严重不满" value={`${severeUnsatisfied}`} helper="当前客户成功计划口径" tone="coral" compact />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="客户成功计划洞察" subtitle="满意度现状、SLA目标达成情况与合作风险情况">
          <div className="grid gap-4 lg:grid-cols-3">
            <DistributionBar
              title="满意度现状"
              data={satisfactionData}
              total={keyScenarios.length}
              toneFor={(label) => (trustPositive.has(label) ? "green" : label.includes("不满") ? "coral" : "blue")}
            />
            <DistributionBar
              title="SLA目标达成情况"
              data={countBy(keyScenarios, (scenario) => scenario.slaAchievement)}
              total={keyScenarios.length}
              toneFor={(label) => (label === "已达成" ? "green" : label.includes("未达成") ? "coral" : "amber")}
            />
            <DistributionBar
              title="合作风险情况"
              data={planRiskData}
              total={keyScenarios.length}
              toneFor={(label) => (label.includes("无风险") || label.includes("已闭环") ? "green" : label.includes("修复中") ? "amber" : "coral")}
            />
          </div>
        </Panel>

        <Panel title="项目管理风险" subtitle="端到端项目管理中的满意度合作风险">
          <div className="space-y-4">
            <div className="risk-orbit">
              <div className="risk-orbit-core">
                <ShieldAlert size={22} />
                <strong>{projectRiskCount}</strong>
                <span>风险项目</span>
              </div>
              <div className="risk-orbit-ring" />
            </div>
            <DistributionBar
              title="满意度合作风险"
              data={projectRiskData}
              total={projects.length}
              toneFor={(label) => (label.includes("无风险") ? "green" : label.includes("可控") ? "amber" : "coral")}
            />
          </div>
        </Panel>
      </div>

      <Panel title="服务续费管理" subtitle="续费目标结合已续费下单金额，自动计算完成比例">
        <div className="renewal-dashboard">
          <div>
            <div className="flex items-center gap-2 text-[#1454b8]">
              <Sparkles size={18} />
              <span className="text-sm font-black">续费完成比例</span>
            </div>
            <p className="mt-3 text-4xl font-black text-[#0f172a]">{renewalCompletion}%</p>
            <p className="muted-text mt-2 text-sm">
              已续费下单金额 {renewedOrderAmount.toLocaleString()} W / 续费目标 {renewalTarget.toLocaleString()} W
            </p>
          </div>
          <div className="renewal-meter">
            <div className="renewal-meter-fill" style={{ width: `${renewalCompletion}%` }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SignalTile icon={<CircleDollarSign size={18} />} label="续费目标" value={`${renewalTarget.toLocaleString()} W`} helper="服务续费管理汇总" tone="blue" />
            <SignalTile icon={<Activity size={18} />} label="已下单金额" value={`${renewedOrderAmount.toLocaleString()} W`} helper="已续费下单金额" tone="green" />
            <SignalTile icon={<UsersRound size={18} />} label="续费客户" value={`${serviceRenewals.length}`} helper="服务续费记录数" tone="amber" />
          </div>
        </div>
      </Panel>

      <Panel title="重点风险与本周动作" subtitle="优先处理高风险客户、逾期事项和高金额项目">
        {weeklyTasks.length ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {weeklyTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="task-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="muted-text text-sm">{task.customer}</p>
                    <h3 className="mt-1 font-semibold">{task.title}</h3>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
                <p className="muted-text mt-4 text-sm">负责人：{task.owner} · 预计完成日期：{task.planDate}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </Panel>
    </section>
  );
}
