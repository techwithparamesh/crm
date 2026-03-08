import path from "path";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { authOrApiTokenMiddleware } from "./middleware/apiTokenAuthMiddleware.js";
import { tenantMiddleware } from "./middleware/tenantMiddleware.js";
import { rateLimitPerUser } from "./middleware/rateLimitPerUser.js";
import { customDomainMiddleware } from "./middleware/customDomainMiddleware.js";

import authRoutes from "./modules/auth/auth.routes.js";
import moduleRoutes from "./modules/modules/modules.routes.js";
import fieldRoutes from "./modules/fields/fields.routes.js";
import recordRoutes from "./modules/records/records.routes.js";
import pipelineRoutes from "./modules/pipelines/pipelines.routes.js";
import taskRoutes from "./modules/tasks/tasks.routes.js";
import automationRoutes from "./modules/automations/automations.routes.js";
import dashboardRoutes from "./modules/dashboards/dashboards.routes.js";
import roleDashboardsRoutes from "./modules/role-dashboards/role-dashboards.routes.js";
import relationshipsRoutes from "./modules/relationships/relationships.routes.js";
import recordRelationsRoutes from "./modules/record-relations/record-relations.routes.js";
import activityLogRoutes from "./modules/activity-log/activity-log.routes.js";
import activitiesRoutes from "./modules/activities/activities.routes.js";
import commentsRoutes from "./modules/comments/comments.routes.js";
import assignmentRulesRoutes from "./modules/assignment-rules/assignment-rules.routes.js";
import duplicateRulesRoutes from "./modules/duplicate-rules/duplicate-rules.routes.js";
import auditLogRoutes from "./modules/audit-log/audit-log.routes.js";
import rolesRoutes from "./modules/roles/roles.routes.js";
import tenantSettingsRoutes from "./modules/tenant-settings/tenant-settings.routes.js";
import apiTokensRoutes from "./modules/api-tokens/api-tokens.routes.js";
import webhooksRoutes from "./modules/webhooks/webhooks.routes.js";
import importExportRoutes from "./modules/import-export/importExport.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import searchRoutes from "./modules/search/search.routes.js";
import emailRoutes from "./modules/email/email.routes.js";
import filesRoutes from "./modules/files/files.routes.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import crmTemplatesRoutes from "./modules/crm-templates/templates.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import whatsappRoutes from "./modules/whatsapp/whatsapp.routes.js";
import { handleWebhook } from "./modules/whatsapp/whatsapp.webhook.js";
import formsRoutes from "./modules/lead-capture/forms.routes.js";
import { handleWebhookLeads } from "./modules/lead-capture/webhook-leads.routes.js";
import { initQueues } from "./queues/queues.js";

const app = express();

app.use(customDomainMiddleware);
const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadDir));

app.use(cors({ origin: process.env.FRONTEND_URL ?? "*", credentials: true }));
// WhatsApp webhook: GET for Meta verification; POST with raw body for inbound/delivery
app.get("/whatsapp/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const verifyToken = process.env.WHATSAPP_META_VERIFY_TOKEN;
  if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Forbidden");
  }
});
app.post("/whatsapp/webhook", express.raw({ type: "application/json" }), (req, res, next) => {
  handleWebhook(req, res).catch(next);
});
app.use(express.json({ limit: "10mb" }));

app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { error: "Too many requests" },
  })
);

// Public
app.use("/auth", authRoutes);
app.use("/tenant", tenantSettingsRoutes);
app.use("/forms", formsRoutes);

// Inbound lead webhook (no auth; tenant via X-API-Key)
app.post("/webhooks/leads", (req, res, next) => {
  handleWebhookLeads(req, res).catch(next);
});

// Protected (tenant-scoped) — per-user rate limit (100/min) after auth
// Fields router first so /modules/fields/:id is not caught by module GET /:id
app.use("/modules", authMiddleware, rateLimitPerUser, tenantMiddleware, fieldRoutes);
app.use("/modules", authMiddleware, rateLimitPerUser, tenantMiddleware, moduleRoutes);
app.use("/records", authOrApiTokenMiddleware, rateLimitPerUser, tenantMiddleware, recordRoutes);
app.use("/pipelines", authMiddleware, rateLimitPerUser, tenantMiddleware, pipelineRoutes);
app.use("/tasks", authMiddleware, rateLimitPerUser, tenantMiddleware, taskRoutes);
app.use("/automations", authMiddleware, rateLimitPerUser, tenantMiddleware, automationRoutes);
app.use("/dashboards", authMiddleware, rateLimitPerUser, tenantMiddleware, dashboardRoutes);
app.use("/role-dashboards", authMiddleware, rateLimitPerUser, tenantMiddleware, roleDashboardsRoutes);
app.use("/module-relationships", authMiddleware, rateLimitPerUser, tenantMiddleware, relationshipsRoutes);
app.use("/record-relations", authMiddleware, rateLimitPerUser, tenantMiddleware, recordRelationsRoutes);
app.use("/activity-log", authMiddleware, rateLimitPerUser, tenantMiddleware, activityLogRoutes);
app.use("/activities", authMiddleware, rateLimitPerUser, tenantMiddleware, activitiesRoutes);
app.use("/comments", authMiddleware, rateLimitPerUser, tenantMiddleware, commentsRoutes);
app.use("/assignment-rules", authMiddleware, rateLimitPerUser, tenantMiddleware, assignmentRulesRoutes);
app.use("/duplicate-rules", authMiddleware, rateLimitPerUser, tenantMiddleware, duplicateRulesRoutes);
app.use("/audit-logs", authMiddleware, rateLimitPerUser, tenantMiddleware, auditLogRoutes);
app.use("/roles", authMiddleware, rateLimitPerUser, tenantMiddleware, rolesRoutes);
app.use("/users", authMiddleware, rateLimitPerUser, tenantMiddleware, usersRoutes);
app.use("/api-tokens", authMiddleware, rateLimitPerUser, tenantMiddleware, apiTokensRoutes);
app.use("/webhooks", authMiddleware, rateLimitPerUser, tenantMiddleware, webhooksRoutes);
app.use("/import-export", authMiddleware, rateLimitPerUser, tenantMiddleware, importExportRoutes);
app.use("/notifications", authMiddleware, rateLimitPerUser, tenantMiddleware, notificationsRoutes);
app.use("/search", authMiddleware, rateLimitPerUser, tenantMiddleware, searchRoutes);
app.use("/emails", authMiddleware, rateLimitPerUser, tenantMiddleware, emailRoutes);
app.use("/files", authMiddleware, rateLimitPerUser, tenantMiddleware, filesRoutes);
app.use("/billing", authMiddleware, rateLimitPerUser, billingRoutes);
app.use("/crm-templates", crmTemplatesRoutes);
// Spec alias: POST /api/templates/install (same as POST /crm-templates/install)
app.use("/api/templates", crmTemplatesRoutes);
app.use("/whatsapp", whatsappRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

initQueues()
  .catch((e) => console.warn("Queues init:", (e as Error).message))
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  });
