export const successPlanFields = [
  "customer",
  "scenario",
  "productLine",
  "isLargeVolumeScenario",
  "businessStage",
  "goalDimension",
  "goalDescription",
  "achievement",
  "blockingAchieved",
  "keyPerson",
  "keyPersonLevel",
  "satisfactionCurrent",
  "quarterlyGoal",
  "monthlyChange",
  "projectStage",
  "businessNeedInsight",
  "businessValueGoal",
  "slaGoal",
  "pocEffect",
  "businessValueRealization",
  "keyPersonRecognition",
  "slaAchievement",
  "satisfactionRisk",
  "deliveryMotEffect",
  "afterSalesMotEffect",
  "otherKeyActivityEffect",
  "keyGap",
  "juneKeyAction",
  "nextCheckDate",
] as const;

export type SuccessPlanField = (typeof successPlanFields)[number];

export const successPlanFieldLabels: Record<SuccessPlanField, string> = {
  customer: "客户",
  scenario: "项目场景",
  productLine: "产品线",
  isLargeVolumeScenario: "是否大体量场景",
  businessStage: "业务阶段",
  goalDimension: "目标维度",
  goalDescription: "目标描述",
  achievement: "目标达成情况",
  blockingAchieved: "是否已实现卡位",
  keyPerson: "关键人姓名/所属部门",
  keyPersonLevel: "关键人最高层级",
  satisfactionCurrent: "满意度现状",
  quarterlyGoal: "季度目标",
  monthlyChange: "月度变化情况",
  projectStage: "项目阶段",
  businessNeedInsight: "业务需求洞察是否充分",
  businessValueGoal: "业务价值目标制定情况",
  slaGoal: "SLA目标制定情况",
  pocEffect: "POC效果",
  businessValueRealization: "业务价值实际兑现效果",
  keyPersonRecognition: "关键人感知认可",
  slaAchievement: "SLA目标达成情况",
  satisfactionRisk: "满意度合作风险情况",
  deliveryMotEffect: "交付阶段MOT效果",
  afterSalesMotEffect: "售后阶段MOT效果",
  otherKeyActivityEffect: "其他关键活动效果",
  keyGap: "围绕目标最关键的差距",
  juneKeyAction: "6月关键目标举措",
  nextCheckDate: "下次沟通检视时间",
};

const trustOptions = ["充分信赖", "信任支持", "价值无感", "不够满意", "严重不满"];
const goalClearOptions = ["目标明确", "目标不明确", "未制定"];
const motEffectOptions = ["有开展，效果好，推动认可", "有开展，阶段性有变化", "有开展，没变化", "计划已定，待开展", "未开展", " 不涉及"];

export const successPlanEnumOptions: Partial<Record<SuccessPlanField, string[]>> = {
  productLine: ["AD", "MSS", "XDR", "aES", "AF", "AC", "安全服务", "aDesk", "GPT", "HCI", "aTrust", "SIP", "sase", "sip", "EDS", "AI安全平台", "SG", "SDDC", "CSSP", "vpn"],
  isLargeVolumeScenario: ["是", "否"],
  businessStage: ["1.0 客户洞察", "2.0 业务设计与共识", "3.0 解决方案落地与组织关系", "4.0 客户成功"],
  goalDimension: ["复购", "续约", "新业务突破", "设备换新"],
  achievement: ["复购已下单", "复购机会已立项", "续费已达成", "突破业务价值已兑现", "未达成", "续费已立项", "完成部分续费"],
  blockingAchieved: ["是", "否", "非卡位项目"],
  keyPersonLevel: ["高层", "中层-预算决策人", "中层-技术决策人", "基层-有决策力", "基层-无决策力"],
  satisfactionCurrent: trustOptions,
  quarterlyGoal: trustOptions,
  monthlyChange: ["提升至充分信赖", "提升至信任支持", "下降至严重不满", "下降至不够满意", "无变化", "有非常正向的变化"],
  projectStage: ["售前", "POC", "交付", "售后"],
  businessNeedInsight: ["是", "否"],
  businessValueGoal: goalClearOptions,
  slaGoal: goalClearOptions,
  pocEffect: ["效果好-符合预期并有优势", "效果一般-符合预期优势不明显", "效果不好-明显无优势", "不清楚", "未到出结果阶段"],
  businessValueRealization: ["价值充分兑现", "价值未充分兑现", "毫无价值", "未到兑现阶段"],
  keyPersonRecognition: trustOptions,
  slaAchievement: ["已达成", "未到成果阶段", "未达成"],
  satisfactionRisk: ["有风险修复中", "有风险已闭环", "无风险", "不涉及"],
  deliveryMotEffect: motEffectOptions,
  afterSalesMotEffect: motEffectOptions,
  otherKeyActivityEffect: motEffectOptions,
};

export const successPlanEnumFields = Object.keys(successPlanEnumOptions) as SuccessPlanField[];

export function getSuccessPlanEnumTone(value: string) {
  if (!value) return "neutral";
  if (
    value.includes("充分") ||
    value.includes("信任") ||
    value.includes("已达成") ||
    value.includes("已下单") ||
    value.includes("已立项") ||
    value.includes("已兑现") ||
    value.includes("无风险") ||
    value.includes("已闭环") ||
    value.includes("效果好") ||
    value.includes("价值充分") ||
    value.includes("目标明确") ||
    value === "是" ||
    value.includes("正向")
  ) {
    return "green";
  }
  if (
    value.includes("一般") ||
    value.includes("待开展") ||
    value.includes("未到") ||
    value.includes("不清楚") ||
    value.includes("部分") ||
    value.includes("修复中") ||
    value.includes("无变化")
  ) {
    return "amber";
  }
  if (
    value.includes("未达成") ||
    value.includes("不够") ||
    value.includes("严重") ||
    value.includes("毫无") ||
    value.includes("不好") ||
    value.includes("未制定") ||
    value.includes("不明确") ||
    value.includes("未开展") ||
    value === "否"
  ) {
    return "red";
  }
  if (value.includes("价值无感") || value.includes("客户洞察") || value.includes("业务设计")) return "blue";
  if (value.includes("POC") || value.includes("交付")) return "green-soft";
  if (value.includes("复购") || value.includes("续")) return "purple";
  return "neutral";
}

export const successPlanDbColumns: Record<SuccessPlanField, string> = {
  customer: "customer_name",
  scenario: "scenario_name",
  productLine: "product_line",
  isLargeVolumeScenario: "is_large_volume_scenario",
  businessStage: "business_stage",
  goalDimension: "goal_dimension",
  goalDescription: "goal_description",
  achievement: "achievement",
  blockingAchieved: "blocking_achieved",
  keyPerson: "key_person",
  keyPersonLevel: "key_person_level",
  satisfactionCurrent: "satisfaction_current",
  quarterlyGoal: "quarterly_goal",
  monthlyChange: "monthly_change",
  projectStage: "project_stage",
  businessNeedInsight: "business_need_insight",
  businessValueGoal: "business_value_goal",
  slaGoal: "sla_goal",
  pocEffect: "poc_effect",
  businessValueRealization: "business_value_realization",
  keyPersonRecognition: "key_person_recognition",
  slaAchievement: "sla_achievement",
  satisfactionRisk: "satisfaction_risk",
  deliveryMotEffect: "delivery_mot_effect",
  afterSalesMotEffect: "after_sales_mot_effect",
  otherKeyActivityEffect: "other_key_activity_effect",
  keyGap: "key_gap",
  juneKeyAction: "june_key_action",
  nextCheckDate: "next_check_date",
};
