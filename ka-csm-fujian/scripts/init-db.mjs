import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

async function loadEnvFile() {
  const envPath = resolve(".env.local");
  try {
    const content = await readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1);
      process.env[key] ||= value;
    }
  } catch {
    // .env.local is optional; explicit environment variables also work.
  }
}

const keyScenarioColumns = {
  customer: "customer_name",
  scenario: "scenario_name",
  productLine: "product_line",
  isLargeVolumeScenario: "is_large_volume_scenario",
  owner: "owner_name",
  goalDimension: "goal_dimension",
  goalDescription: "goal_description",
  businessStage: "business_stage",
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
  updatedAt: "last_updated_at",
};

const projectColumns = {
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
  updatedAt: "last_updated_at",
};

const serviceRenewalColumns = {
  customerName: "customer_name",
  owner: "owner_name",
  managementSheet: "management_sheet",
  renewalTarget: "renewal_target",
  nonEosExpiredDevices: "non_eos_expired_devices",
  renewedDevices: "renewed_devices",
  renewedOrderAmount: "renewed_order_amount",
  deviceRenewalRate: "device_renewal_rate",
  remainingRenewalAmount: "remaining_renewal_amount",
  eosReplacementTarget: "eos_replacement_target",
  eosExpiredDevices: "eos_expired_devices",
  replacedDevices: "replaced_devices",
  replacementOrderAmount: "replacement_order_amount",
  eosReplacementRate: "eos_replacement_rate",
  remainingReplacementAmount: "remaining_replacement_amount",
  updatedAt: "last_updated_at",
};

const ownerHints = [
  ["宁德", "林明纲"],
  ["福耀", "林明纲"],
  ["三锋", "林明纲"],
  ["象屿", "姚中强"],
  ["国贸", "姚中强"],
  ["信息集团", "姚中强"],
  ["翔业", "姚中强"],
  ["建发", "林喆"],
  ["紫金", "林喆"],
  ["港口", "林喆"],
  ["国际银行", "林喆"],
  ["大数据", "张秋"],
  ["公安", "张秋"],
  ["数字福州", "张秋"],
  ["电力", "王志杰"],
  ["轨道", "郭艺勇"],
];

function normalizeScenarioOwner(row) {
  const knownOwners = new Set(["林明纲", "张秋", "姚中强", "林喆", "王志杰", "郭艺勇"]);
  if (knownOwners.has(row.owner)) return row;
  const hint = ownerHints.find(([keyword]) => String(row.customer ?? "").includes(keyword));
  return { ...row, owner: hint?.[1] ?? row.owner };
}

async function insertRows(connection, table, columnMap, rows) {
  const keys = Object.keys(columnMap);
  const columns = keys.map((key) => columnMap[key]);
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

  for (const row of rows) {
    await connection.execute(sql, keys.map((key) => row[key] ?? null));
  }
}

async function main() {
  await loadEnvFile();

  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;

  if (!user || !password) {
    throw new Error("Missing MYSQL_USER or MYSQL_PASSWORD. Copy .env.example to .env.local and fill credentials.");
  }

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "192.200.15.177",
    port: Number(process.env.MYSQL_PORT || 3306),
    user,
    password,
    multipleStatements: true,
  });

  const schema = await readFile(resolve("database/schema.sql"), "utf8");
  const seed = await readFile(resolve("database/seed.sql"), "utf8");
  const keyScenarios = JSON.parse(await readFile(resolve("key-scenarios.json"), "utf8")).map(normalizeScenarioOwner);
  const projects = JSON.parse(await readFile(resolve("end-to-end-projects.json"), "utf8"));
  const serviceRenewals = JSON.parse(await readFile(resolve("service-renewals.json"), "utf8"));

  await connection.query("DROP DATABASE IF EXISTS ka_csm_fujian");
  await connection.query(schema);
  await connection.query(seed);
  await insertRows(connection, "key_scenarios", keyScenarioColumns, keyScenarios);
  await insertRows(connection, "end_to_end_projects", projectColumns, projects);
  await insertRows(connection, "service_renewals", serviceRenewalColumns, serviceRenewals);
  await connection.end();

  console.log(
    `Database initialized: ${keyScenarios.length} key scenarios, ${projects.length} end-to-end projects, ${serviceRenewals.length} service renewals`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
