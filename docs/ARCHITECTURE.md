# Dynamic CRM Platform — System Architecture

## Overview

This is a **metadata-driven, multi-tenant CRM** where business entities (modules, fields, pipelines, dashboards, automations) are defined in configuration, not in fixed schema. All record data is stored in a generic EAV-style structure keyed by module and field metadata.

## Design Principles

1. **Metadata-driven** — No hardcoded "Leads" or "Deals". Modules and fields are stored in `Module` and `Field` tables; record data lives in `Record` + `RecordValue`.
2. **Multi-tenant** — Every core entity is scoped by `tenantId`. Tenants are isolated via middleware and query filters.
3. **Extensible** — New field types, trigger types, and actions can be added via config and enums without schema changes for most cases.
4. **Modular** — Backend is split into domain modules (auth, tenants, modules, fields, records, pipelines, tasks, automations, dashboards) with clear boundaries.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                         │
│  App Router · ShadCN · TanStack Table · Zustand · React Hook Form │
└───────────────────────────────┬─────────────────────────────────┘
                                │ REST API (JWT)
┌───────────────────────────────▼─────────────────────────────────┐
│                     BACKEND (Express + TypeScript)                │
│  auth · tenant · error middleware · rate limit · Zod validation   │
├──────────────────────────────────────────────────────────────────┤
│  Modules: auth | tenants | users | modules | fields | records     │
│           pipelines | tasks | automations | dashboards             │
├──────────────────────────────────────────────────────────────────┤
│  Automation Engine (rule evaluation + action execution)            │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Prisma
┌───────────────────────────────▼─────────────────────────────────┐
│                     MySQL (multi-tenant)                          │
│  Tenants · Users · Roles · Modules · Fields · Records · EAV       │
│  Pipelines · Stages · Tasks · Automations · Dashboards · Widgets  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model Summary

| Layer        | Tables / Concepts |
|-------------|-------------------|
| **Tenancy** | `Tenant`, `User`, `Role` (per-tenant roles, `permissionsJSON`) |
| **Metadata**| `Module`, `Field` (define what entities exist and their attributes) |
| **Data**    | `Record` (one per “row” per module), `RecordValue` (EAV: fieldId → value in text/number/date/JSON) |
| **Process** | `Pipeline`, `PipelineStage`; record ↔ stage via a special field or `recordStageId` on Record |
| **Work**    | `Task` (linked to `relatedRecordId`, `assignedTo`, dueDate, status) |
| **Automation** | `Automation` (triggerType, conditionsJSON, actionsJSON) |
| **Analytics** | `Dashboard`, `Widget` (widgetType, configJSON) |
| **SaaS**    | Placeholders: plan on Tenant, usage/billing, API tokens, audit logs |

## Record Storage (EAV)

- **Record**: `id`, `moduleId`, `tenantId`, `createdBy`, optional `pipelineStageId`, timestamps.
- **RecordValue**: one row per field per record. Value stored in:
  - `valueText` (text, email, phone, textarea, dropdown single, file URL)
  - `valueNumber` (number, currency)
  - `valueDate` (date, datetime)
  - `valueJSON` (multi-select, checkbox list, complex)

All create/update of “record data” goes through a **RecordService** that:
- Validates against `Field` metadata (required, type, options).
- Writes/updates only `Record` + `RecordValue` rows.

## Automation Engine

- **Trigger types**: `record_created`, `record_updated`, `stage_changed`, `task_overdue`.
- **Conditions**: stored as JSON (e.g. `[{ "field": "fieldKey", "operator": "eq", "value": "x" }]`).
- **Actions**: `create_task`, `send_email`, `send_webhook`, `update_field`.
- Engine is **pluggable**: new trigger/action types can be registered without changing core flow. Execution can be sync (in-request) or async (job queue placeholder).

## Security

- **Auth**: JWT in `Authorization: Bearer <token>`; tenant and user from token.
- **Tenant isolation**: All queries filtered by `tenantId` from token (middleware sets context).
- **Input**: Zod schemas per endpoint; no raw body trust.
- **Rate limiting**: Applied on API routes.
- **RBAC**: `Role.permissionsJSON` used to guard routes and UI (structure TBD; e.g. `{ "modules": { "read": [...], "write": [...] } }`).

## Multi-Tenancy

- One MySQL database; tenant separation by `tenantId` on every table.
- Middleware: resolve JWT → user → tenantId; attach to request; all services receive tenantId and enforce it in Prisma queries.

## Scalability Notes

- Indexes on `tenantId`, `moduleId`, `recordId`, and common filters (e.g. stage, createdBy).
- Record list/detail APIs can be paginated; heavy reporting can later move to read replicas or analytics DB.
- Automation execution can be moved to a job queue (Bull, Inngest, etc.) with the same engine interface.

## Frontend Architecture

- **App Router**: `/dashboard`, `/modules`, `/modules/[moduleId]`, `/records/[moduleId]`, `/record/[recordId]`, `/pipelines`, `/automations`, `/settings`.
- **State**: Zustand for global UI state; server state via fetch/SWR or TanStack Query.
- **Dynamic UI**: Module list and record table/forms are built from module/field metadata; pipeline view from pipeline + stages; dashboard from widget configs.
- **Auth**: Login page; JWT stored (e.g. httpOnly cookie or memory + refresh); protected layout checks auth and tenant.

## SaaS Placeholders

- **Tenant.plan**: free / starter / growth / enterprise.
- **Billing**: Stripe (or other) integration placeholder.
- **Usage limits**: per-tenant counters (records, automations, etc.) with checks in services.
- **API tokens**: table `ApiToken` (tenantId, name, hash, scopes); validate in middleware for server-to-server.
- **Audit logs**: table `AuditLog` (tenantId, userId, action, entityType, entityId, changesJSON); write in critical paths.
