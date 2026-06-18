import endToEndProjectRows from "../../end-to-end-projects.json";
import keyScenarioRows from "../../key-scenarios.json";
import serviceRenewalRows from "../../service-renewals.json";
import type { EndToEndProjectField } from "./project-fields";
import type { ServiceRenewalField } from "./service-renewal-fields";
import type { SuccessPlanField } from "./success-plan-fields";

export type CustomerStatus = "充分信任" | "信任支持" | "价值无感" | "不够满意" | "严重不满";
export type ProjectType = "突破" | "续费" | "复购" | "以旧换新/EOS";
export type TaskStatus = "未开始" | "进行中" | "逾期" | "已完成";

export const customerStatuses: CustomerStatus[] = ["充分信任", "信任支持", "价值无感", "不够满意", "严重不满"];
export const riskLevels = ["低", "中", "高"] as const;
export const contactLevels = ["高层", "中层", "基层"] as const;
export const weeklyStatuses: TaskStatus[] = ["未开始", "进行中", "逾期", "已完成"];

export type Customer = {
  id: string;
  actualCustomerName?: string;
  name: string;
  parentCustomerName: string;
  secondaryUnitName?: string;
  status: CustomerStatus;
  manager: string;
  city: string;
  industry: string;
  breakAmount: number;
  renewalAmount: number;
  repurchaseAmount: number;
  eosAmount: number;
  risk: (typeof riskLevels)[number];
  updatedAt: string;
  remark: string;
};

export type Contact = {
  id: string;
  customer: string;
  name: string;
  department: string;
  title: string;
  level: (typeof contactLevels)[number];
  attitude: CustomerStatus;
  owner: string;
  lastTouch: string;
};

export type SuccessPlan = {
  id: string;
  customer: string;
  scenario: string;
  owner: string;
  stage: string;
  inKcp: boolean;
  status: "进行中" | "已完成" | "暂停";
  revenueProgress: number;
  relationProgress: number;
  valueProgress: number;
  contacts: string[];
  nextAction: string;
  updatedAt: string;
};

export type KeyScenario = Record<SuccessPlanField, string> & {
  id: string;
  owner: string;
  updatedAt: string;
};

export type Project = Record<EndToEndProjectField, string> & {
  id: string;
  updatedAt: string;
};

export type ServiceRenewal = Record<ServiceRenewalField, string | number> & {
  id: string;
  updatedAt: string;
};

export type WeeklyTask = {
  id: string;
  customer: string;
  title: string;
  owner: string;
  planDate: string;
  status: TaskStatus;
  resultNote: string;
};

export const managers = ["林明纲", "张秋", "姚中强", "林喆", "王志杰", "郭艺勇"];

export const managerPhones: Record<string, string> = {
  林明纲: "91202",
  张秋: "42012",
  姚中强: "27624",
  林喆: "19852",
  郭艺勇: "19736",
};

export const customers: Customer[] = [
  ...[
    ["紫金矿业集团股份有限公司", "林喆"],
    ["福建省港口集团有限责任公司", "林喆"],
    ["厦门建发集团有限公司", "林喆"],
    ["厦门国际银行股份有限公司", "林喆"],
    ["厦门国贸控股集团有限公司", "姚中强"],
    ["厦门信息集团", "姚中强"],
    ["厦门翔业集团有限公司（机场）", "姚中强"],
    ["厦门象屿集团有限公司", "姚中强"],
    ["福耀玻璃工业集团股份有限公司", "林明纲"],
    ["宁德时代新能源科技股份有限公司", "林明纲"],
    ["福建省农村信用社联合社", "林明纲"],
    ["福建省公安厅", "张秋"],
    ["福州市公安局", "张秋"],
    ["福建省大数据集团有限公司", "张秋"],
    ["数字福州集团", "张秋"],
    ["福州地铁集团有限公司", "林明纲"],
    ["国网福建省电力有限公司", "王志杰"],
    ["厦门轨道交通集团有限公司", "郭艺勇"],
    ["福建三锋汽配开发有限公司", "林明纲"],
    ["福建三锋控股集团有限公司", "林明纲"],
  ].map<Customer>(([name, manager], index) => ({
    id: `cust-${String(index + 1).padStart(3, "0")}`,
    actualCustomerName: name,
    name,
    parentCustomerName: "",
    secondaryUnitName: "",
    status: "信任支持",
    manager,
    city: "",
    industry: "",
    breakAmount: 0,
    renewalAmount: 0,
    repurchaseAmount: 0,
    eosAmount: 0,
    risk: "中",
    updatedAt: "2026-06-17 09:35",
    remark: "",
  })),
];

export const contacts: Contact[] = [];

export const plans: SuccessPlan[] = [];

const customerOwnerHints = new Map<string, string>([
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
]);

function normalizeOwner(customer: string, owner: string) {
  if (managers.includes(owner)) return owner;
  const hint = [...customerOwnerHints.entries()].find(([keyword]) => customer.includes(keyword));
  return hint?.[1] ?? owner;
}

export const keyScenarios = (keyScenarioRows as Omit<KeyScenario, "id">[]).map<KeyScenario>((row, index) => ({
  id: `ks-${index + 1}`,
  ...row,
  owner: normalizeOwner(row.customer, row.owner),
}));

export const projects = (endToEndProjectRows as Omit<Project, "id">[]).map<Project>((row, index) => ({
  id: `e2e-${index + 1}`,
  ...row,
}));

export const serviceRenewals = (serviceRenewalRows as Omit<ServiceRenewal, "id">[]).map<ServiceRenewal>((row, index) => ({
  id: `renewal-${index + 1}`,
  ...row,
}));

export const weeklyTasks: WeeklyTask[] = [];

export const summary = {
  updatedAt: "2026-06-17 09:35",
  totalCustomers: customers.length,
  totalRevenue: customers.reduce((sum, item) => sum + item.breakAmount + item.renewalAmount + item.repurchaseAmount + item.eosAmount, 0),
  planRate: 76,
  alignmentRate: 68,
  scenarioRate: 82,
  contactTrustRate: 64,
};
