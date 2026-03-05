const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("crm_token");
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token = getToken(), ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? res.statusText ?? "Request failed");
  return data as T;
}

export const authApi = {
  register: (body: { name: string; email: string; password: string; tenantName: string }) =>
    api<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string; tenantId: string }) =>
    api<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => api<{ user: AuthUser }>("/auth/me"),
};

export interface TenantBranding {
  companyName: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export const tenantApi = {
  getBranding: (tenantId?: string) =>
    api<TenantBranding>(`tenant/branding${tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ""}`),
  getSettings: () => api<TenantSettings>("tenant/settings"),
  updateSettings: (body: Partial<TenantSettings>) =>
    api<TenantSettings>("tenant/settings", { method: "PUT", body: JSON.stringify(body) }),
  uploadImage: (type: "logo" | "favicon", data: string) =>
    api<{ url: string }>("tenant/settings/upload", { method: "POST", body: JSON.stringify({ type, data }) }),
};

export interface TenantSettings {
  id: string;
  tenantId: string;
  companyName: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  customDomain: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  roleId: string | null;
  permissions?: import("./permissions").RolePermissions | null;
}

export interface AuthResponse {
  user: AuthUser;
  tenant: { id: string; name: string };
  token: string;
}

export const modulesApi = {
  list: () => api<ModuleWithCount[]>("modules"),
  get: (id: string) => api<ModuleWithFields>(`modules/${id}`),
  create: (body: { name: string; slug: string; icon?: string; description?: string }) =>
    api<Module>("modules", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ name: string; slug: string; icon: string; description: string }>) =>
    api<Module>(`modules/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`modules/${id}`, { method: "DELETE" }),
};

export const fieldsApi = {
  list: (moduleId: string) => api<Field[]>(`modules/${moduleId}/fields`),
  create: (moduleId: string, body: CreateFieldBody) =>
    api<Field>(`modules/${moduleId}/fields`, { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<CreateFieldBody>) =>
    api<Field>(`modules/fields/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`modules/fields/${id}`, { method: "DELETE" }),
};

export const recordsApi = {
  list: (moduleId: string, params?: { page?: number; limit?: number; stageId?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.stageId) q.set("stageId", params.stageId);
    return api<{ items: RecordListItem[]; total: number; page: number; limit: number }>(`records/${moduleId}?${q}`);
  },
  get: (id: string) => api<RecordDetail>(`records/detail/${id}`),
  create: (body: { moduleId: string; values?: Record<string, unknown>; pipelineStageId?: string }) =>
    api<RecordDetail>("records", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { values?: Record<string, unknown>; pipelineStageId?: string | null }) =>
    api<RecordDetail>(`records/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`records/${id}`, { method: "DELETE" }),
  updateStage: (id: string, stageId: string) =>
    api<unknown>(`records/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stageId }) }),
};

export const pipelinesApi = {
  list: () => api<PipelineWithStages[]>("pipelines"),
  get: (id: string) => api<PipelineWithStages>(`pipelines/${id}`),
  create: (body: { moduleId: string; name: string }) =>
    api<Pipeline>("pipelines", { method: "POST", body: JSON.stringify(body) }),
  createStage: (body: { pipelineId: string; stageName: string; orderIndex?: number }) =>
    api<PipelineStage>("pipelines/pipeline-stages", { method: "POST", body: JSON.stringify(body) }),
};

export const tasksApi = {
  list: (params?: { assignedTo?: string; status?: string; relatedRecordId?: string }) => {
    const q = new URLSearchParams();
    if (params?.assignedTo) q.set("assignedTo", params.assignedTo);
    if (params?.status) q.set("status", params.status);
    if (params?.relatedRecordId) q.set("relatedRecordId", params.relatedRecordId);
    return api<Task[]>(`tasks?${q}`);
  },
  create: (body: { relatedRecordId?: string; assignedTo?: string; title?: string; description?: string; dueDate?: string; status?: string }) =>
    api<Task>("tasks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ assignedTo: string; title: string; description: string; dueDate: string; status: string }>) =>
    api<Task>(`tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

export const automationsApi = {
  list: (moduleId?: string) => api<Automation[]>(`automations${moduleId ? `?moduleId=${moduleId}` : ""}`),
  get: (id: string) => api<Automation>(`automations/${id}`),
  create: (body: { moduleId?: string; name?: string; triggerType: string; conditionsJSON?: string; actionsJSON: string; isActive?: boolean }) =>
    api<Automation>("automations", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ moduleId: string; name: string; triggerType: string; conditionsJSON: string; actionsJSON: string; isActive: boolean }>) =>
    api<Automation>(`automations/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`automations/${id}`, { method: "DELETE" }),
};

export const dashboardsApi = {
  list: () => api<Dashboard[]>("dashboards"),
  get: (id: string) => api<DashboardWithWidgets>(`dashboards/${id}`),
  create: (body: { name: string }) => api<Dashboard>("dashboards", { method: "POST", body: JSON.stringify(body) }),
  createWidget: (body: { dashboardId: string; widgetType: string; configJSON?: string; orderIndex?: number }) =>
    api<Widget>("dashboards/widgets", { method: "POST", body: JSON.stringify(body) }),
  updateWidget: (id: string, body: { widgetType?: string; configJSON?: string; orderIndex?: number }) =>
    api<Widget>(`dashboards/widgets/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteWidget: (id: string) => api<void>(`dashboards/widgets/${id}`, { method: "DELETE" }),
};

export const relationshipsApi = {
  list: (moduleId?: string) =>
    api<ModuleRelationship[]>(`module-relationships${moduleId ? `?moduleId=${moduleId}` : ""}`),
  get: (id: string) => api<ModuleRelationship>(`module-relationships/${id}`),
  create: (body: { name: string; sourceModuleId: string; targetModuleId: string; relationshipType: "one_to_many" | "many_to_many" }) =>
    api<ModuleRelationship>("module-relationships", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ name: string; sourceModuleId: string; targetModuleId: string; relationshipType: string }>) =>
    api<ModuleRelationship>(`module-relationships/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`module-relationships/${id}`, { method: "DELETE" }),
};

export const recordRelationsApi = {
  getRelated: (recordId: string) =>
    api<RelatedRecordEntry[]>(`record-relations/record/${recordId}/related`),
  link: (body: { relationshipId: string; sourceRecordId: string; targetRecordId: string }) =>
    api<RecordRelation>("record-relations", { method: "POST", body: JSON.stringify(body) }),
  unlink: (id: string) => api<void>(`record-relations/${id}`, { method: "DELETE" }),
};

export const activityLogApi = {
  listByRecord: (recordId: string, limit?: number) =>
    api<ActivityLogEntry[]>(`activity-log?recordId=${recordId}${limit != null ? `&limit=${limit}` : ""}`),
};

export const rolesApi = {
  list: () => api<Role[]>("roles"),
  get: (id: string) => api<Role>("roles/" + id),
  create: (body: { name: string; permissionsJSON?: string }) =>
    api<Role>("roles", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { name?: string; permissionsJSON?: string | null }) =>
    api<Role>(`roles/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`roles/${id}`, { method: "DELETE" }),
};

export interface ApiTokenListItem {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  createdBy: string | null;
}

export interface ApiTokenCreated {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export const apiTokensApi = {
  list: () => api<ApiTokenListItem[]>("api-tokens"),
  create: (body: { name: string; permissionsJSON?: string | null }) =>
    api<ApiTokenCreated>("api-tokens", { method: "POST", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`api-tokens/${id}`, { method: "DELETE" }),
};

export const WEBHOOK_EVENT_TYPES = ["record_created", "record_updated", "record_deleted", "stage_changed", "task_created"] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export interface Webhook {
  id: string;
  tenantId: string;
  eventType: string;
  targetUrl: string;
  secretKey: string | null;
  isActive: boolean;
  createdAt: string;
}

export const webhooksApi = {
  list: () => api<Webhook[]>("webhooks"),
  create: (body: { eventType: WebhookEventType; targetUrl: string; secretKey?: string | null; isActive?: boolean }) =>
    api<Webhook>("webhooks", { method: "POST", body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`webhooks/${id}`, { method: "DELETE" }),
};

// Import / Export
export interface CsvParseResult {
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, string>[];
}

export interface ImportJobStatus {
  id: string;
  tenantId: string;
  moduleId: string;
  status: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export const importExportApi = {
  parseCsv: async (file: File): Promise<CsvParseResult> => {
    const form = new FormData();
    form.append("file", file);
    const token = getToken();
    const res = await fetch(`${API_BASE}import-export/parse`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? res.statusText ?? "Parse failed");
    return data as CsvParseResult;
  },
  getFieldsForImport: (moduleId: string) =>
    api<{ module: { id: string; name: string; slug: string }; fields: { id: string; fieldKey: string; label: string; fieldType: string; isRequired: boolean }[] }>(`import-export/fields/${moduleId}`),
  runImportWithFile: async (file: File, moduleId: string, mapping: Record<string, string>, useJobQueue?: boolean): Promise<{ jobId?: string; successCount?: number; errorCount?: number; errors?: string[] }> => {
    const form = new FormData();
    form.append("file", file);
    form.append("moduleId", moduleId);
    form.append("mapping", JSON.stringify(mapping));
    if (useJobQueue !== undefined) form.append("useJobQueue", String(useJobQueue));
    const token = getToken();
    const res = await fetch(`${API_BASE}import-export/run`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? res.statusText ?? "Import failed");
    return data;
  },
  runImportWithRows: (moduleId: string, mapping: Record<string, string>, rows: Record<string, string>[], useJobQueue?: boolean) =>
    api<{ jobId?: string; successCount?: number; errorCount?: number; errors?: string[] }>("import-export/run", {
      method: "POST",
      body: JSON.stringify({ moduleId, mapping, rows, useJobQueue }),
    }),
  listImportJobs: () => api<ImportJobStatus[]>("import-export/jobs"),
  getImportJob: (id: string) => api<ImportJobStatus>("import-export/jobs/" + id),
  downloadExport: async (moduleId: string, format: "csv" | "excel", fields?: string[]) => {
    const q = new URLSearchParams({ moduleId, format });
    if (fields?.length) q.set("fields", fields.join(","));
    const token = getToken();
    const res = await fetch(`${API_BASE}import-export/download?${q}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export.${format === "csv" ? "csv" : "xlsx"}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export interface NotificationItem {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
}

export interface GlobalSearchResult {
  [moduleSlug: string]: RecordListItem[];
}

export const searchApi = {
  global: (q: string, limitPerModule?: number) => {
    const params = new URLSearchParams({ q: q.trim() });
    if (limitPerModule != null) params.set("limitPerModule", String(limitPerModule));
    return api<GlobalSearchResult>(`search?${params}`);
  },
};

export const notificationsApi = {
  list: (params?: { unreadOnly?: boolean; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.unreadOnly) q.set("unreadOnly", "true");
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.offset != null) q.set("offset", String(params.offset));
    return api<NotificationsResponse>(`notifications?${q}`);
  },
  markAsRead: (id: string) => api<{ ok: boolean }>(`notifications/${id}/read`, { method: "PATCH" }),
  markAllAsRead: () => api<{ ok: boolean }>("notifications/read-all", { method: "POST" }),
};

// Types
export interface Module {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}
export interface ModuleWithCount extends Module {
  _count?: { records: number; fields: number };
}
export interface ModuleWithFields extends Module {
  fields: Field[];
}
export interface Field {
  id: string;
  moduleId: string;
  tenantId: string;
  label: string;
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
  isUnique: boolean;
  optionsJSON: string | null;
  defaultValue: string | null;
  orderIndex: number;
}
export interface CreateFieldBody {
  label: string;
  fieldKey: string;
  fieldType: string;
  isRequired?: boolean;
  isUnique?: boolean;
  optionsJSON?: string;
  defaultValue?: string;
  orderIndex?: number;
}
export interface RecordListItem {
  id: string;
  moduleId: string;
  values: Record<string, unknown>;
  stage?: { id: string; stageName: string; orderIndex: number } | null;
  createdAt: string;
  updatedAt: string;
}
export interface RecordDetail extends RecordListItem {
  module?: { name: string; slug: string };
  creator?: { id: string; name: string; email: string } | null;
}
export interface Pipeline {
  id: string;
  tenantId: string;
  moduleId: string;
  name: string;
}
export interface PipelineStage {
  id: string;
  pipelineId: string;
  stageName: string;
  orderIndex: number;
}
export interface PipelineWithStages extends Pipeline {
  module?: Module;
  stages: PipelineStage[];
}
export interface Task {
  id: string;
  tenantId: string;
  relatedRecordId: string | null;
  assignedTo: string | null;
  title: string | null;
  description: string | null;
  dueDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string; email: string } | null;
}
export interface Automation {
  id: string;
  tenantId: string;
  moduleId: string | null;
  name: string | null;
  triggerType: string;
  conditionsJSON: string | null;
  actionsJSON: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Dashboard {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface Widget {
  id: string;
  dashboardId: string;
  widgetType: string;
  configJSON: string | null;
  orderIndex: number;
}
export interface DashboardWithWidgets extends Dashboard {
  widgets: Widget[];
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  permissionsJSON: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { users: number };
}

export interface ModuleRelationship {
  id: string;
  tenantId: string;
  name: string;
  sourceModuleId: string;
  targetModuleId: string;
  relationshipType: string;
  sourceModule?: Module;
  targetModule?: Module;
}

export interface RecordRelation {
  id: string;
  relationshipId: string;
  sourceRecordId: string;
  targetRecordId: string;
}

export interface RelatedRecordEntry {
  id: string;
  relationshipId: string;
  relationshipName: string;
  relationshipType: string;
  thisRole: "source" | "target";
  relatedRecord: { id: string; moduleId: string; moduleName: string; values: Record<string, unknown> };
}

export interface ActivityLogEntry {
  id: string;
  eventType: string;
  userId: string | null;
  metadataJSON: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

// ============== EMAIL ==============

export interface SmtpConfigResponse {
  configured: boolean;
  id?: string;
  tenantId?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  fromEmail?: string;
  fromName?: string | null;
}

export interface EmailLogItem {
  id: string;
  tenantId: string;
  recordId: string | null;
  to: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

export const emailApi = {
  getSmtp: () => api<SmtpConfigResponse>("emails/smtp"),
  updateSmtp: (body: {
    host: string;
    port: number;
    secure?: boolean;
    user: string;
    password?: string;
    fromEmail: string;
    fromName?: string | null;
  }) =>
    api<SmtpConfigResponse & { id: string }>("emails/smtp", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  send: (body: {
    to: string;
    subject: string;
    body: string;
    recordId?: string | null;
  }) =>
    api<{ id: string; status: string }>("emails/send", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listLogs: (recordId?: string) =>
    api<EmailLogItem[]>(
      recordId ? `emails/logs?recordId=${encodeURIComponent(recordId)}` : "emails/logs"
    ),
};

// ============== FILES (record attachments, S3 / storage) ==============

export interface FileItem {
  id: string;
  tenantId: string;
  recordId: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string | null;
  createdAt: string;
  uploader?: { id: string; name: string; email: string } | null;
}

export const filesApi = {
  listByRecord: (recordId: string) =>
    api<FileItem[]>(`files?recordId=${encodeURIComponent(recordId)}`),
  upload: async (recordId: string, file: File): Promise<FileItem> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
    const form = new FormData();
    form.append("file", file);
    form.append("recordId", recordId);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? res.statusText ?? "Upload failed");
    return data as FileItem;
  },
  delete: (id: string) =>
    api<void>(`files/${id}`, { method: "DELETE" }),
};

// ============== BILLING ==============

export type BillingCycle = "monthly" | "yearly";

export interface PlanLimit {
  maxUsers: number;
  maxModules: number;
  maxRecords: number;
  maxAutomations: number;
  maxApiCalls: number | null;
  maxStorageGB: number | null;
}

export interface PlanItem {
  id: string;
  name: string;
  description: string | null;
  pricePerUser: number;
  billingCycle: string;
  isActive: boolean;
  limits: PlanLimit | null;
}

export interface SubscriptionResponse {
  id: string;
  planId: string;
  planName: string;
  status: string;
  billingCycle: string;
  userCount: number;
  activeUserCount: number;
  pricePerUser: number;
  monthlyTotal: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  limits: PlanLimit | null;
}

export interface InvoiceItem {
  id: string;
  tenantId: string;
  subscriptionId: string;
  userCount: number;
  pricePerUser: number;
  totalAmount: number;
  status: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  createdAt: string;
  subscription?: { plan: { name: string } };
}

export const billingApi = {
  getPlans: () => api<PlanItem[]>("billing/plans"),
  getSubscription: () =>
    api<SubscriptionResponse | { subscription: null }>("billing/subscription"),
  getInvoices: (limit?: number) =>
    api<InvoiceItem[]>(`billing/invoices${limit != null ? `?limit=${limit}` : ""}`),
  subscribe: (body: { planId: string; billingCycle: BillingCycle }) =>
    api<{ subscriptionId: string }>("billing/subscribe", { method: "POST", body: JSON.stringify(body) }),
  changePlan: (body: { planId: string; billingCycle: BillingCycle }) =>
    api<{ ok: boolean }>("billing/change-plan", { method: "POST", body: JSON.stringify(body) }),
  cancel: () => api<{ ok: boolean }>("billing/cancel", { method: "POST" }),
};

export interface CrmTemplateItem {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
}

export const crmTemplatesApi = {
  list: () => api<CrmTemplateItem[]>("crm-templates"),
  get: (id: string) => api<CrmTemplateItem & { templateJSON: string }>(`crm-templates/${id}`),
  install: (templateId: string) =>
    api<{ installed: boolean }>("crm-templates/install", {
      method: "POST",
      body: JSON.stringify({ templateId }),
    }),
};

// WhatsApp
export interface WhatsAppConversation {
  id: string;
  phoneNumber: string;
  status: string;
  recordId: string | null;
  messages?: WhatsAppMessage[];
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  phoneNumber: string;
  messageBody: string;
  direction: "inbound" | "outbound";
  status: string;
  createdAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  templateBody: string;
  variablesJSON: string | null;
}

export const whatsappApi = {
  send: (body: { phoneNumber: string; messageBody: string; recordId?: string | null; conversationId?: string | null }) =>
    api<{ messageId: string; conversationId: string; providerMessageId: string } | { queued: boolean }>("whatsapp/send", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  sendTemplate: (body: {
    phoneNumber: string;
    templateId: string;
    variables?: Record<string, string>;
    recordId?: string | null;
    conversationId?: string | null;
  }) =>
    api<{ messageId: string; conversationId: string; providerMessageId: string } | { queued: boolean }>("whatsapp/send-template", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getMessages: (params: { conversationId?: string; recordId?: string }) => {
    const q = new URLSearchParams();
    if (params.conversationId) q.set("conversationId", params.conversationId);
    if (params.recordId) q.set("recordId", params.recordId);
    return api<WhatsAppMessage[]>(`whatsapp/messages?${q.toString()}`);
  },
  getConversations: (recordId?: string) =>
    api<WhatsAppConversation[]>(`whatsapp/conversations${recordId ? `?recordId=${encodeURIComponent(recordId)}` : ""}`),
  getTemplates: () => api<WhatsAppTemplate[]>("whatsapp/templates"),
};

// Lead capture / Forms
export interface FormFieldConfig {
  fieldKey: string;
  type: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
}

export interface WebFormListItem {
  id: string;
  formName: string;
  moduleId: string;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  module?: { id: string; name: string; slug: string };
  _count?: { submissions: number };
}

export interface WebFormDetail extends WebFormListItem {
  fieldsJSON: string;
  redirectUrl: string | null;
  successMessage: string | null;
  recaptchaEnabled: boolean;
  autoAssignUserId: string | null;
}

export interface FormSubmissionItem {
  id: string;
  formId: string;
  recordId: string;
  payloadJSON: string;
  sourceIP: string | null;
  userAgent: string | null;
  createdAt: string;
  record?: { id: string; createdAt: string };
}

export interface FormAnalytics {
  views: number;
  submissions: number;
  conversionRate: number;
}

export const formsApi = {
  list: () => api<WebFormListItem[]>("forms"),
  get: (id: string) => api<WebFormDetail>(`forms/${id}`),
  create: (body: {
    moduleId: string;
    formName: string;
    fieldsJSON: string;
    redirectUrl?: string | null;
    successMessage?: string | null;
    isActive?: boolean;
    recaptchaEnabled?: boolean;
    autoAssignUserId?: string | null;
  }) => api<WebFormDetail>("forms", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<WebFormDetail>) =>
    api<WebFormDetail>(`forms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getSubmissions: (formId: string, limit?: number) =>
    api<FormSubmissionItem[]>(`forms/${formId}/submissions${limit != null ? `?limit=${limit}` : ""}`),
  getAnalytics: (formId: string) => api<FormAnalytics>(`forms/${formId}/analytics`),
};
