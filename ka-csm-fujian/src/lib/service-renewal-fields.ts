export const serviceRenewalFields = [
  "customerName",
  "owner",
  "managementSheet",
  "renewalTarget",
  "nonEosExpiredDevices",
  "renewedDevices",
  "renewedOrderAmount",
  "deviceRenewalRate",
  "remainingRenewalAmount",
  "eosReplacementTarget",
  "eosExpiredDevices",
  "replacedDevices",
  "replacementOrderAmount",
  "eosReplacementRate",
  "remainingReplacementAmount",
] as const;

export type ServiceRenewalField = (typeof serviceRenewalFields)[number];

export const serviceRenewalFieldLabels: Record<ServiceRenewalField, string> = {
  customerName: "客户名称",
  owner: "服务经理",
  managementSheet: "服务续费管理表",
  renewalTarget: "续费目标",
  nonEosExpiredDevices: "非EOS过保设备数量（台）",
  renewedDevices: "已续费设备数量（台）",
  renewedOrderAmount: "已续费下单金额（W）",
  deviceRenewalRate: "设备续约率",
  remainingRenewalAmount: "剩余续费必签可控金额（W）",
  eosReplacementTarget: "EOS换新目标",
  eosExpiredDevices: "EOS过保设备数量（台）",
  replacedDevices: "已换新设备数量（台）",
  replacementOrderAmount: "已换新下单金额（W）",
  eosReplacementRate: "EOS换新率",
  remainingReplacementAmount: "剩余换新必签可控金额（W）",
};

export const serviceRenewalDbColumns: Record<ServiceRenewalField, string> = {
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
};

export const serviceRenewalNumericFields: ServiceRenewalField[] = serviceRenewalFields.filter(
  (field) => field !== "customerName" && field !== "owner" && field !== "managementSheet",
);
