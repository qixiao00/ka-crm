import { useMemo } from "react";
import { ALL_MANAGERS_LABEL } from "@/config/navigation";
import type { Contact, Customer, KeyScenario, Project, ServiceRenewal, SuccessPlan, WeeklyTask } from "@/lib/data";
import type { AppRole } from "@/types/app";

type UseScopedCsmDataOptions = {
  contacts: Contact[];
  customers: Customer[];
  plans: SuccessPlan[];
  keyScenarios: KeyScenario[];
  projects: Project[];
  serviceRenewals: ServiceRenewal[];
  weeklyTasks: WeeklyTask[];
  managerFilter: string;
  query: string;
  role: AppRole;
  currentManager?: string;
};

export function useScopedCsmData({
  contacts,
  customers,
  keyScenarios,
  managerFilter,
  plans,
  projects,
  serviceRenewals,
  query,
  role,
  currentManager,
  weeklyTasks,
}: UseScopedCsmDataOptions) {
  const customerManagerMap = useMemo(() => {
    const entries = customers.flatMap((customer) => [
      [customer.name, customer.manager] as const,
      [customer.actualCustomerName ?? customer.name, customer.manager] as const,
    ]);
    return new Map(entries);
  }, [customers]);

  return useMemo(() => {
    const managerScope = role === "manager" ? currentManager : managerFilter;

    const matchesManager = (customerName: string, owner: string) => {
      if (!managerScope || managerScope === ALL_MANAGERS_LABEL) return true;
      return customerManagerMap.get(customerName) === managerScope || owner === managerScope;
    };

    const matchesText = (values: Array<string | number>) => {
      const keyword = query.trim().toLowerCase();
      if (!keyword) return true;
      return values.join(" ").toLowerCase().includes(keyword);
    };

    const filteredCustomers = customers.filter((customer) => {
      return (
        matchesManager(customer.actualCustomerName ?? customer.name, customer.manager) &&
        matchesText([customer.name, customer.actualCustomerName ?? "", customer.city, customer.industry, customer.manager, customer.status, customer.risk])
      );
    });

    const filteredContacts = contacts.filter((contact) => {
      return (
        matchesManager(contact.customer, contact.owner) &&
        matchesText([contact.customer, contact.name, contact.department, contact.title, contact.owner, contact.attitude])
      );
    });

    const filteredPlans = plans.filter((plan) => {
      return (
        matchesManager(plan.customer, plan.owner) &&
        matchesText([plan.customer, plan.scenario, plan.owner, plan.stage, plan.status, plan.nextAction])
      );
    });

    const filteredKeyScenarios = keyScenarios.filter((scenario) => {
      return (
        matchesManager(scenario.customer, scenario.owner) &&
        matchesText([scenario.customer, scenario.scenario, scenario.productLine, scenario.owner, scenario.businessStage, scenario.achievement, scenario.juneKeyAction])
      );
    });

    const filteredProjects = projects.filter((project) => {
      return (
        matchesManager(project.groupCustomer, project.owner) &&
        matchesText([project.groupCustomer, project.secondaryUnit, project.projectName, project.solution, project.product, project.owner, project.projectProgress])
      );
    });

    const filteredServiceRenewals = serviceRenewals.filter((renewal) => {
      return (
        matchesManager(String(renewal.customerName), String(renewal.owner)) &&
        matchesText([
          String(renewal.customerName),
          String(renewal.owner),
          String(renewal.managementSheet),
          Number(renewal.renewalTarget),
          Number(renewal.eosReplacementTarget),
        ])
      );
    });

    const filteredWeeklyTasks = weeklyTasks.filter((task) => {
      return (
        matchesManager(task.customer, task.owner) &&
        matchesText([task.customer, task.title, task.owner, task.status, task.planDate, task.resultNote])
      );
    });

    return {
      filteredCustomers,
      filteredContacts,
      filteredPlans,
      filteredKeyScenarios,
      filteredProjects,
      filteredServiceRenewals,
      filteredWeeklyTasks,
    };
  }, [contacts, currentManager, customerManagerMap, customers, keyScenarios, managerFilter, plans, projects, query, role, serviceRenewals, weeklyTasks]);
}
