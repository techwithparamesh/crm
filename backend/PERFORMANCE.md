# CRM Performance Optimization

## Database (Prisma)

- **Indexes added** in `prisma/schema.prisma`:
  - `Record`: `@@index([tenantId, moduleId])`, `@@index([tenantId, moduleId, updatedAt])`, `@@index([tenantId, createdAt])`
  - `RecordValue`: `@@index([recordId, fieldId])`
  - `Task`: `@@index([tenantId, status])`, `@@index([tenantId, dueDate])`
- **List records default limit**: 50 per page (max 100). See `records.validation.ts`.

Run migrations after schema changes:
```bash
npx prisma migrate dev
```

## Query optimization

- **Records list**: Uses `Promise.all` for count + page query; ordering by `updatedAt`; pagination with configurable limit (default 50).
- **N+1 avoided**: Single query for records with `include: { values: { include: { field: true } }, stage: true }`.

## Redis caching

- **Location**: `src/utils/redis.ts`, `src/utils/cacheKeys.ts`
- **TTL**: 5 minutes for cached entries.
- **Cached data**:
  - Module metadata + fields: `getModuleById` (key: `crm:module:{tenantId}:{moduleId}`)
  - Pipeline + stages: `getPipelineById` (key: `crm:pipeline:{tenantId}:{pipelineId}`)
- **Invalidation**: On module/pipeline update or delete (and when creating a new stage).
- **Config**: Set `REDIS_URL` (e.g. `redis://localhost:6379`). If unset, cache is skipped (no-op).

## Background jobs (BullMQ)

- **Queues**: `csv-import`, `webhook-dispatch`, `automation-run`, `email-send`
- **Definitions**: `src/queues/queues.ts` (connection from `REDIS_URL`)
- **Worker**: `src/workers/worker.ts` — run separately:

  ```bash
  # Development
  npm run dev:worker

  # Production (after build)
  npm run worker
  ```

- **CSV import**: When `REDIS_URL` is set and the import is queued, the job is pushed to `csv-import` and processed by the worker. Otherwise, processing runs in-process via `setImmediate`.

## API rate limiting

- **Global** (all routes): `express-rate-limit` in `index.ts` — configurable via `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`.
- **Per-user** (protected routes): `src/middleware/rateLimitPerUser.ts` — 100 requests per minute per user (key: `user:{userId}`). Configure with `RATE_LIMIT_PER_USER_MAX`.

## Search

- Global search uses PostgreSQL full-text search (`to_tsvector`, `plainto_tsquery`) in `modules/search/search.service.ts`. Searchable field types: text, textarea, email, phone, dropdown.

## Frontend

- **TanStack Query**: `QueryProvider` in root layout; default `staleTime` 1 min, `gcTime` 5 min.
- **Records list**: `useQuery` for module and list with keys `["module", moduleId]` and `["records", moduleId, page]`; page size 50.
- **Virtualized list**: `VirtualizedRecordCardList` (mobile) when there are more than 25 cards; uses `@tanstack/react-virtual`.
