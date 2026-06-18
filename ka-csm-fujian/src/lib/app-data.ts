import type { RowDataPacket } from "mysql2/promise";
import {
  contacts as staticContacts,
  customers as staticCustomers,
  keyScenarios as staticKeyScenarios,
  managers as staticManagers,
  plans as staticPlans,
  projects as staticProjects,
  serviceRenewals as staticServiceRenewals,
  summary as staticSummary,
  weeklyTasks as staticWeeklyTasks,
  managerPhones,
  type Contact,
  type Customer,
  type KeyScenario,
  type Project,
  type ServiceRenewal,
  type SuccessPlan,
  type WeeklyTask,
} from "./data";
import { canManageUsers, canViewAllData, type AuthUser } from "./auth";
import { getDb, hasDatabaseConfig } from "./db";
import { endToEndProjectDbColumns, endToEndProjectFields } from "./project-fields";
import { serviceRenewalDbColumns, serviceRenewalFields } from "./service-renewal-fields";
import { successPlanDbColumns, successPlanFields } from "./success-plan-fields";
import { getManagerRows, getUserAccounts, type ManagerOption, type UserAccount } from "./user-service";

export type AppSummary = typeof staticSummary;

export type AppData = {
  source: "database" | "static";
  user: AuthUser;
  canManageUsers: boolean;
  managerOptions: ManagerOption[];
  managers: string[];
  customers: Customer[];
  contacts: Contact[];
  plans: SuccessPlan[];
  keyScenarios: KeyScenario[];
  projects: Project[];
  serviceRenewals: ServiceRenewal[];
  weeklyTasks: WeeklyTask[];
  users: UserAccount[];
  summary: AppSummary;
};

type CustomerRow = RowDataPacket & {
  id: number;
  name: string;
  parent_customer_name: string | null;
  city: string;
  industry: string;
  satisfaction_status: Customer["status"];
  risk_level: Customer["risk"];
  manager_name: string;
  break_amount: string | number;
  renewal_amount: string | number;
  repurchase_amount: string | number;
  eos_amount: string | number;
  remark: string | null;
  last_updated_at: string | null;
};

type ContactRow = RowDataPacket & {
  id: number;
  customer_name: string;
  name: string;
  department: string | null;
  title: string | null;
  level: Contact["level"];
  attitude: Contact["attitude"];
  owner_name: string;
  last_touch_date: string | null;
};

type KeyScenarioRow = RowDataPacket & Record<string, string | number | null> & {
  id: number;
  last_updated_at: string | null;
};

type ProjectRow = RowDataPacket & Record<string, string | number | null> & {
  id: number;
  last_updated_at: string | null;
};

type ServiceRenewalRow = RowDataPacket & Record<string, string | number | null> & {
  id: number;
  last_updated_at: string | null;
};

type WeeklyTaskRow = RowDataPacket & {
  id: number;
  customer_name: string;
  title: string;
  owner_name: string;
  plan_date: string;
  status: WeeklyTask["status"];
  result_note: string | null;
};

const numberValue = (value: string | number | null | undefined) => Number(value) || 0;

function customerWhere(user: AuthUser) {
  return canViewAllData(user) ? "" : "WHERE c.manager_id = :managerId";
}

function keyScenarioWhere(user: AuthUser) {
  return canViewAllData(user) ? "" : "WHERE ks.owner_name = :managerName";
}

function projectWhere(user: AuthUser) {
  return canViewAllData(user) ? "" : "WHERE ep.owner_name = :managerName";
}

function renewalWhere(user: AuthUser) {
  return canViewAllData(user) ? "" : "WHERE sr.owner_name = :managerName";
}

function managerParams(user: AuthUser) {
  return { managerId: user.boundManagerId ?? 0, managerName: user.boundManagerName ?? "" };
}

function formatSummary(customers: Customer[]): AppSummary {
  return {
    ...staticSummary,
    updatedAt: customers[0]?.updatedAt || staticSummary.updatedAt,
    totalCustomers: customers.length,
    totalRevenue: customers.reduce(
      (sum, item) => sum + item.breakAmount + item.renewalAmount + item.repurchaseAmount + item.eosAmount,
      0,
    ),
  };
}

function normalizeCustomer(customer: Customer): Customer {
  if (!customer.parentCustomerName) return customer;
  return {
    ...customer,
    actualCustomerName: customer.actualCustomerName ?? customer.name,
    name: customer.parentCustomerName,
    secondaryUnitName: customer.secondaryUnitName ?? customer.name,
  };
}

function emptyDatabaseData(user: AuthUser): AppData {
  return {
    source: "database",
    user,
    canManageUsers: false,
    managerOptions: [],
    managers: [],
    customers: [],
    contacts: [],
    plans: [],
    keyScenarios: [],
    projects: [],
    serviceRenewals: [],
    weeklyTasks: [],
    users: [],
    summary: formatSummary([]),
  };
}

function getStaticScopedData(user: AuthUser): AppData {
  const visibleManager = canViewAllData(user) ? null : user.boundManagerName;
  const customers = (visibleManager ? staticCustomers.filter((customer) => customer.manager === visibleManager) : staticCustomers).map(normalizeCustomer);
  const customerNames = new Set(customers.flatMap((customer) => [customer.name, customer.actualCustomerName ?? customer.name]));
  const managers = visibleManager ? [visibleManager] : staticManagers;

  return {
    source: "static",
    user,
    canManageUsers: canManageUsers(user),
    managerOptions: managers.map((manager) => ({ id: staticManagers.indexOf(manager) + 1, name: manager })),
    managers,
    customers,
    contacts: staticContacts.filter((contact) => customerNames.has(contact.customer)),
    plans: staticPlans.filter((plan) => customerNames.has(plan.customer)),
    keyScenarios: visibleManager ? staticKeyScenarios.filter((scenario) => scenario.owner === visibleManager) : staticKeyScenarios,
    projects: visibleManager ? staticProjects.filter((project) => project.owner === visibleManager) : staticProjects,
    serviceRenewals: visibleManager ? staticServiceRenewals.filter((renewal) => renewal.owner === visibleManager) : staticServiceRenewals,
    weeklyTasks: staticWeeklyTasks.filter((task) => customerNames.has(task.customer)),
    users: canManageUsers(user) ? getStaticUserAccounts() : [],
    summary: formatSummary(customers),
  };
}

function getStaticUserAccounts(): UserAccount[] {
  return staticManagers
    .filter((manager) => managerPhones[manager])
    .map<UserAccount>((manager, index) => ({
      id: 100 + index + 1,
      name: manager,
      username: managerPhones[manager],
      role: manager === "林喆" ? "supervisor" : "manager",
      roleLabel: manager === "林喆" ? "大客户服务主管" : "大客户服务经理",
      manager,
      managerId: staticManagers.indexOf(manager) + 1,
      phone: managerPhones[manager],
      enabled: true,
    }));
}

function mapKeyScenario(row: KeyScenarioRow): KeyScenario {
  return {
    id: String(row.id),
    owner: String(row.owner_name ?? ""),
    updatedAt: String(row.last_updated_at ?? ""),
    ...Object.fromEntries(
      successPlanFields.map((field) => [field, String(row[successPlanDbColumns[field]] ?? "")]),
    ),
  } as KeyScenario;
}

function mapProject(row: ProjectRow): Project {
  return {
    id: String(row.id),
    updatedAt: String(row.last_updated_at ?? ""),
    ...Object.fromEntries(
      endToEndProjectFields.map((field) => [field, String(row[endToEndProjectDbColumns[field]] ?? "")]),
    ),
  } as Project;
}

function mapServiceRenewal(row: ServiceRenewalRow): ServiceRenewal {
  return {
    id: String(row.id),
    updatedAt: String(row.last_updated_at ?? ""),
    ...Object.fromEntries(
      serviceRenewalFields.map((field) => {
        const column = serviceRenewalDbColumns[field];
        const value = row[column];
        return [field, field === "customerName" || field === "owner" || field === "managementSheet" ? String(value ?? "") : numberValue(value)];
      }),
    ),
  } as ServiceRenewal;
}

export async function getScopedAppData(user: AuthUser): Promise<AppData> {
  if (!hasDatabaseConfig()) return getStaticScopedData(user);
  if (user.role === "manager" && !user.boundManagerId) return emptyDatabaseData(user);

  const db = getDb();
  const params = managerParams(user);

  const [managerRows, [customerRows], [contactRows], [keyScenarioRows], [projectRows], [serviceRenewalRows], [weeklyTaskRows], users] =
    await Promise.all([
      getManagerRows(user),
      db.query<CustomerRow[]>(
        `
          SELECT
            c.id,
            c.name,
            parent.name AS parent_customer_name,
            c.city,
            c.industry,
            c.satisfaction_status,
            c.risk_level,
            m.name AS manager_name,
            c.break_amount,
            c.renewal_amount,
            c.repurchase_amount,
            c.eos_amount,
            c.remark,
            DATE_FORMAT(c.last_updated_at, '%Y-%m-%d %H:%i') AS last_updated_at
          FROM customers c
          LEFT JOIN customers parent ON parent.id = c.parent_customer_id
          JOIN managers m ON m.id = c.manager_id
          ${customerWhere(user)}
          ORDER BY c.last_updated_at DESC, c.id DESC
        `,
        params,
      ),
      db.query<ContactRow[]>(
        `
          SELECT
            ct.id,
            c.name AS customer_name,
            ct.name,
            ct.department,
            ct.title,
            ct.level,
            ct.attitude,
            m.name AS owner_name,
            DATE_FORMAT(ct.last_touch_date, '%Y-%m-%d') AS last_touch_date
          FROM contacts ct
          JOIN customers c ON c.id = ct.customer_id
          JOIN managers m ON m.id = ct.owner_manager_id
          ${customerWhere(user)}
          ORDER BY ct.last_touch_date DESC, ct.id DESC
        `,
        params,
      ),
      db.query<KeyScenarioRow[]>(
        `
          SELECT *, DATE_FORMAT(last_updated_at, '%Y-%m-%d') AS last_updated_at
          FROM key_scenarios ks
          ${keyScenarioWhere(user)}
          ORDER BY ks.customer_name ASC, ks.id ASC
        `,
        params,
      ),
      db.query<ProjectRow[]>(
        `
          SELECT *, DATE_FORMAT(last_updated_at, '%Y-%m-%d') AS last_updated_at
          FROM end_to_end_projects ep
          ${projectWhere(user)}
          ORDER BY ep.id ASC
        `,
        params,
      ),
      db.query<ServiceRenewalRow[]>(
        `
          SELECT *, DATE_FORMAT(last_updated_at, '%Y-%m-%d') AS last_updated_at
          FROM service_renewals sr
          ${renewalWhere(user)}
          ORDER BY sr.id ASC
        `,
        params,
      ),
      db.query<WeeklyTaskRow[]>(
        `
          SELECT
            wt.id,
            c.name AS customer_name,
            wt.title,
            m.name AS owner_name,
            DATE_FORMAT(wt.plan_date, '%Y-%m-%d') AS plan_date,
            wt.status,
            wt.result_note
          FROM weekly_tasks wt
          JOIN customers c ON c.id = wt.customer_id
          JOIN managers m ON m.id = wt.owner_manager_id
          ${customerWhere(user)}
          ORDER BY wt.plan_date ASC, wt.id DESC
        `,
        params,
      ),
      canManageUsers(user) ? getUserAccounts() : Promise.resolve([]),
    ]);

  const customers = customerRows.map<Customer>((customer) => ({
    id: String(customer.id),
    actualCustomerName: customer.name,
    name: customer.parent_customer_name || customer.name,
    parentCustomerName: customer.parent_customer_name ?? "",
    secondaryUnitName: customer.parent_customer_name ? customer.name : "",
    status: customer.satisfaction_status,
    manager: customer.manager_name,
    city: customer.city,
    industry: customer.industry,
    breakAmount: numberValue(customer.break_amount),
    renewalAmount: numberValue(customer.renewal_amount),
    repurchaseAmount: numberValue(customer.repurchase_amount),
    eosAmount: numberValue(customer.eos_amount),
    risk: customer.risk_level,
    updatedAt: customer.last_updated_at ?? "",
    remark: customer.remark ?? "",
  }));

  return {
    source: "database",
    user,
    canManageUsers: canManageUsers(user),
    managerOptions: managerRows.map((manager) => ({ id: manager.id, name: manager.name })),
    managers: managerRows.map((manager) => manager.name),
    customers,
    contacts: contactRows.map<Contact>((contact) => ({
      id: String(contact.id),
      customer: contact.customer_name,
      name: contact.name,
      department: contact.department ?? "",
      title: contact.title ?? "",
      level: contact.level,
      attitude: contact.attitude,
      owner: contact.owner_name,
      lastTouch: contact.last_touch_date ?? "",
    })),
    plans: [],
    keyScenarios: keyScenarioRows.map(mapKeyScenario),
    projects: projectRows.map(mapProject),
    serviceRenewals: serviceRenewalRows.map(mapServiceRenewal),
    weeklyTasks: weeklyTaskRows.map<WeeklyTask>((task) => ({
      id: String(task.id),
      customer: task.customer_name,
      title: task.title,
      owner: task.owner_name,
      planDate: task.plan_date,
      status: task.status,
      resultNote: task.result_note ?? "",
    })),
    users,
    summary: formatSummary(customers),
  };
}
