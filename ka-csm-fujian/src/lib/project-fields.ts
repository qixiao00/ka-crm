export const endToEndProjectFields = [
  "region",
  "groupCustomer",
  "secondaryUnit",
  "owner",
  "projectName",
  "solution",
  "product",
  "projectLevel",
  "isBlockingProject",
  "projectBackground",
  "productionStage",
  "projectProgress",
  "satisfactionRisk",
  "businessValue",
  "latestRecognition",
  "currentMonthRecognition",
  "previousMonthRecognition",
  "slaAchieved",
  "redundancyEffective",
  "knownRiskCleared",
  "riskPerception",
  "keyRemark",
  "nextFocus",
  "nextFollowDate",
  "projectControl",
  "projectControlRemark",
  "atxOriginalNeedClear",
  "atxStandardProductFit",
  "atxCustomizationRisk",
  "atxServiceCostCovered",
  "atxReviewMaterial",
  "pocEffect",
  "pocRemark",
  "pocKeyPersonNeedClear",
  "pocPlanAdvantage",
  "pocTestConditionReady",
  "pocReviewMaterial",
  "startupMeeting",
  "startupRemark",
  "deliveryJobNeedClear",
  "requirementMaterial",
  "hldDesignEffect",
  "hldMaterial",
  "externalKickoff",
  "externalKickoffMaterial",
  "projectRiskProgressVisible",
  "projectManagementMaterial",
  "prrEffect",
  "prrMaterial",
  "stageValuePerception",
  "stageValueMaterial",
  "valueRealization",
  "valueMaterial",
  "opsHandover",
  "opsHandoverMaterial",
  "executiveReview",
  "executiveReviewMaterial",
  "continuedExpansion",
  "continuedExpansionRemark",
] as const;

export type EndToEndProjectField = (typeof endToEndProjectFields)[number];

export const endToEndProjectFieldLabels: Record<EndToEndProjectField, string> = {
  region: "区域",
  groupCustomer: "集团客户",
  secondaryUnit: "二级单位",
  owner: "SA/大客",
  projectName: "项目名称/业务场景",
  solution: "解决方案",
  product: "产品",
  projectLevel: "项目级别",
  isBlockingProject: "是否卡位项目",
  projectBackground: "项目背景",
  productionStage: "生产流阶段",
  projectProgress: "项目进度",
  satisfactionRisk: "满意度合作风险",
  businessValue: "业务价值实际兑现效果",
  latestRecognition: "关键人认可(最新)",
  currentMonthRecognition: "关键人认可(X月)",
  previousMonthRecognition: "关键人认可(X-1月)",
  slaAchieved: "是否达成客户SLA目标",
  redundancyEffective: "自身冗余机制是否有效",
  knownRiskCleared: "已知风险是否及时消除",
  riskPerception: "风险是否能及时感知",
  keyRemark: "关键备注",
  nextFocus: "下一步重点关注",
  nextFollowDate: "下次跟进时间",
  projectControl: "从左边管好项目",
  projectControlRemark: "项目管控备注",
  atxOriginalNeedClear: "原始需求是否清晰",
  atxStandardProductFit: "标品适配度",
  atxCustomizationRisk: "定制风险",
  atxServiceCostCovered: "服务成本是否兜底",
  atxReviewMaterial: "ATX评审材料",
  pocEffect: "POC效果",
  pocRemark: "POC备注",
  pocKeyPersonNeedClear: "关键人需求是否清晰",
  pocPlanAdvantage: "方案优势是否明确",
  pocTestConditionReady: "测试条件是否具备",
  pocReviewMaterial: "POC评审材料",
  startupMeeting: "项目启动分析会",
  startupRemark: "启动备注",
  deliveryJobNeedClear: "交付需求是否清晰",
  requirementMaterial: "需求管理材料",
  hldDesignEffect: "HLD设计效果",
  hldMaterial: "HLD材料",
  externalKickoff: "外部启动会",
  externalKickoffMaterial: "外部启动会材料",
  projectRiskProgressVisible: "风险进度是否可视",
  projectManagementMaterial: "项目管理材料",
  prrEffect: "上线效果验证",
  prrMaterial: "PRR材料",
  stageValuePerception: "阶段价值感知",
  stageValueMaterial: "阶段价值材料",
  valueRealization: "价值兑现",
  valueMaterial: "价值材料",
  opsHandover: "验收转维",
  opsHandoverMaterial: "转维材料",
  executiveReview: "中高层汇报",
  executiveReviewMaterial: "汇报材料",
  continuedExpansion: "持续经营扩大",
  continuedExpansionRemark: "持续经营备注",
};

const recognitionOptions = ["充分信赖", "信任支持", "价值无感", "不够满意", "严重不满"];
const clearNeedOptions = ["清晰-明确各层级需求", "部分清晰-中高层需求不明确", "不清晰"];

export const endToEndProjectEnumOptions: Partial<Record<EndToEndProjectField, string[]>> = {
  solution: ["安全运营", "aDesk", "aTrust", "SDDC", "SASE", "EDS", "物联网安全", "数据安全"],
  product: ["SDDC", "SM-SDDC", "本地XDR", "aDesk", "aTrust", "aTrust-UEM", "EDS", "AD", "aES", "SDWAN", "钓鱼GPT", "运营GPT", "检测GPT", "AF", "SIP"],
  projectLevel: ["区域关键项目", "千万级项目群", "孵化类项目", "行销山头项目", "样板点", "最佳实践"],
  isBlockingProject: ["是", "否"],
  productionStage: [
    "3.0 ATX-管好价值兑现风险",
    "3.0 POC-测出效果优势并验证可落地性",
    "3.0 交付-帮客户(关键人)快速兑现价值",
    "4.0 客户成功-持续经营扩大业务合作范围",
  ],
  projectProgress: [
    "1.0客户洞察",
    "2.0业务设计与客户共识",
    "3.1售前-价值认可",
    "3.2售前-技术测试",
    "3.2售前-测试取消",
    "3.3售前-合理决策放弃",
    "3.3售前-推动立项",
    "3.4售前-引导采购方式及标准",
    "3.5售前-项目中标到订单",
    "3.6丢单",
    "3.7交付-启动阶段",
    "3.8交付-规划阶段",
    "3.9交付-执行阶段",
    "3.10交付-收尾阶段",
    "4.0客户成功",
  ],
  satisfactionRisk: ["无风险", "风险可控（有解决方案）", "风险不可控（无解决方案）"],
  businessValue: ["价值充分兑现", "价值未充分兑现", "毫无价值", "未到兑现阶段"],
  latestRecognition: recognitionOptions,
  currentMonthRecognition: recognitionOptions,
  previousMonthRecognition: recognitionOptions,
  slaAchieved: ["已达成", "未到成果阶段", "未达成"],
  redundancyEffective: ["有效-6个月内切换过", "未验证", "无冗余机制", "验证无效", "不清楚"],
  knownRiskCleared: [
    "无风险-近3月巡检无风险且预警全部修复",
    "有风险-与客户已共识消除计划",
    "有风险-无消除计划或与客户未共识",
    "不清楚-近3月未巡检",
    "其他（见备注）",
  ],
  riskPerception: ["能感知-有监控且能满足要求", "无法感知-未对接监控且无感知手段", "无法感知-有对接但有差距", "不清楚"],
  projectControl: ["效果好-风险充分识别且管控好", "效果一般-有开展但有差距", "效果差-有开展但基本无变化", "未开展-计划中", "未开展"],
  atxOriginalNeedClear: clearNeedOptions,
  atxStandardProductFit: ["标品满足", "标品不满足-定制&版本投入可保障", "标品不满足-定制&版本投入无法保障"],
  atxCustomizationRisk: ["无风险-方案兑现进度正常", "有风险-方案存在跳票风险", "有风险-无方案或里程碑计划"],
  atxServiceCostCovered: ["能兜住", "兜不住", "不清楚"],
  pocEffect: ["效果好-符合预期并有优势", "效果一般-符合预期优势不明显", "效果不好-明显无优势", "不清楚", "未到出结果阶段"],
  pocKeyPersonNeedClear: clearNeedOptions,
  pocPlanAdvantage: ["是-具备明显优势", "否-不具备明显优势", "不清楚"],
  pocTestConditionReady: ["是-具备测出优势条件", "否-不是最优环境", "未确认-不清楚"],
  startupMeeting: ["效果好-目标共识且项目有序推进", "效果一般-未有效识别风险推进", "未开展-无变化", "未开展-计划中"],
  deliveryJobNeedClear: ["好-各层级需求清楚", "差-需求不清楚", "待确认-有风险"],
  hldDesignEffect: ["效果好-充分考虑可落地", "效果一般-维度考虑有缺失", "未设计", "未到此阶段"],
  externalKickoff: ["效果好-客户信心明显增强", "效果一般-信心无明显增强", "效果差-客户负面反馈", "未开展", "未到此阶段"],
  projectRiskProgressVisible: ["好-客户进展可视可控", "中-内部可视但未向客户同步", "差-内外部均不可视可控"],
  prrEffect: ["效果好-验证符合预期", "效果一般-存在部分缺陷", "待开展-已计划", "未开展", "未到此阶段"],
  stageValuePerception: ["效果好-关键人感受到阶段性价值", "效果一般-关键人未表达认可", "待开展-已计划", "未开展-无计划", "未到此阶段"],
  valueRealization: ["效果好-关键人明显认可", "效果一般-关键人无明显认可", "效果差-关键人明显不认可", "待开展-计划中", "未执行-无直接感知"],
  opsHandover: ["效果好-与客户运维流程融合且运转起来", "效果一般-有融合但运转有差距", "效果差-客户无法自运转起来", "待开展-计划中", "未执行"],
  executiveReview: ["有开展-效果好，推动认可", "有开展-阶段性有变化", "有开展-没变化", "待开展-计划中", "未开展", "不涉及"],
  continuedExpansion: ["有直接促进", "暂不明显", "份额缩小", "不清楚"],
};

export const endToEndProjectEnumFields = Object.keys(endToEndProjectEnumOptions) as EndToEndProjectField[];

export function getProjectEnumTone(value: string) {
  if (!value) return "neutral";
  if (
    value.includes("无风险") ||
    value.includes("充分") ||
    value.includes("信任") ||
    value.includes("已达成") ||
    value.includes("有效") ||
    value.includes("价值充分") ||
    value.includes("能感知") ||
    value.includes("效果好") ||
    value.includes("清晰") ||
    value.includes("标品满足") ||
    value.includes("能兜住") ||
    value.includes("具备") ||
    value.includes("好-") ||
    value.includes("有直接促进") ||
    value.includes("收尾")
  ) {
    return "green";
  }
  if (
    value.includes("未验证") ||
    value.includes("未到") ||
    value.includes("可控") ||
    value.includes("部分") ||
    value.includes("效果一般") ||
    value.includes("待开展") ||
    value.includes("未确认") ||
    value.includes("中-") ||
    value.includes("暂不明显") ||
    value.includes("引导") ||
    value.includes("立项") ||
    value.includes("样板") ||
    value.includes("最佳")
  ) {
    return "amber";
  }
  if (
    value.includes("不够") ||
    value.includes("严重") ||
    value.includes("不可控") ||
    value.includes("无解决") ||
    value.includes("毫无") ||
    value.includes("未达成") ||
    value.includes("无冗余") ||
    value.includes("兜不住") ||
    value.includes("不满足") ||
    value.includes("不具备") ||
    value.includes("不清晰") ||
    value.includes("差-") ||
    value.includes("效果差") ||
    value.includes("效果不好") ||
    value.includes("无法感知") ||
    value.includes("无方案") ||
    value.includes("未开展") ||
    value.includes("未执行") ||
    value.includes("份额缩小") ||
    value.includes("验证无效") ||
    value.includes("丢单") ||
    value.includes("取消") ||
    value.includes("放弃")
  ) {
    return "red";
  }
  if (value.includes("价值无感") || value.includes("ATX") || value.includes("区域关键") || value.includes("千万级") || value.includes("交付")) {
    return "blue";
  }
  if (value.includes("孵化") || value.includes("POC")) return "green-soft";
  if (value.includes("行销")) return "rose";
  if (value.includes("项目中标")) return "purple";
  return "neutral";
}

export const endToEndProjectDbColumns: Record<EndToEndProjectField, string> = {
  region: "region",
  groupCustomer: "group_customer",
  secondaryUnit: "secondary_unit",
  owner: "owner_name",
  projectName: "project_name",
  solution: "solution",
  product: "product",
  projectLevel: "project_level",
  isBlockingProject: "is_blocking_project",
  projectBackground: "project_background",
  productionStage: "production_stage",
  projectProgress: "project_progress",
  satisfactionRisk: "satisfaction_risk",
  businessValue: "business_value",
  latestRecognition: "latest_recognition",
  currentMonthRecognition: "current_month_recognition",
  previousMonthRecognition: "previous_month_recognition",
  slaAchieved: "sla_achieved",
  redundancyEffective: "redundancy_effective",
  knownRiskCleared: "known_risk_cleared",
  riskPerception: "risk_perception",
  keyRemark: "key_remark",
  nextFocus: "next_focus",
  nextFollowDate: "next_follow_date",
  projectControl: "project_control",
  projectControlRemark: "project_control_remark",
  atxOriginalNeedClear: "atx_original_need_clear",
  atxStandardProductFit: "atx_standard_product_fit",
  atxCustomizationRisk: "atx_customization_risk",
  atxServiceCostCovered: "atx_service_cost_covered",
  atxReviewMaterial: "atx_review_material",
  pocEffect: "poc_effect",
  pocRemark: "poc_remark",
  pocKeyPersonNeedClear: "poc_key_person_need_clear",
  pocPlanAdvantage: "poc_plan_advantage",
  pocTestConditionReady: "poc_test_condition_ready",
  pocReviewMaterial: "poc_review_material",
  startupMeeting: "startup_meeting",
  startupRemark: "startup_remark",
  deliveryJobNeedClear: "delivery_job_need_clear",
  requirementMaterial: "requirement_material",
  hldDesignEffect: "hld_design_effect",
  hldMaterial: "hld_material",
  externalKickoff: "external_kickoff",
  externalKickoffMaterial: "external_kickoff_material",
  projectRiskProgressVisible: "project_risk_progress_visible",
  projectManagementMaterial: "project_management_material",
  prrEffect: "prr_effect",
  prrMaterial: "prr_material",
  stageValuePerception: "stage_value_perception",
  stageValueMaterial: "stage_value_material",
  valueRealization: "value_realization",
  valueMaterial: "value_material",
  opsHandover: "ops_handover",
  opsHandoverMaterial: "ops_handover_material",
  executiveReview: "executive_review",
  executiveReviewMaterial: "executive_review_material",
  continuedExpansion: "continued_expansion",
  continuedExpansionRemark: "continued_expansion_remark",
};
