import { Router } from "express";
import multer from "multer";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as importExportService from "./importExport.service.js";
import { runImportSchema, exportQuerySchema } from "./importExport.validation.js";
import { parseCsv } from "./csvParser.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
    cb(null, !!ok);
  },
});

/** POST /import/parse — upload CSV, return headers and sample for mapping */
router.post("/parse", upload.single("file"), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file?.buffer) {
      res.status(400).json({ error: "CSV file required" });
      return;
    }
    const parsed = await importExportService.parseCsvFile(req.file.buffer);
    const sampleRows = parsed.rows.slice(0, 5);
    res.json({
      headers: parsed.headers,
      rowCount: parsed.rowCount,
      sampleRows,
    });
  } catch (e) {
    next(e);
  }
});

/** POST /import/run — run import: multipart file + moduleId + mapping (JSON string), or JSON body with rows from client */
router.post("/run", upload.single("file"), async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const createdBy = req.user!.id === "api" ? null : req.user!.id;

    let rows: Record<string, string>[];
    let moduleId: string;
    let mapping: Record<string, string>;
    let useJobQueue: boolean | undefined;

    if (req.file?.buffer) {
      const parsed = parseCsv(req.file.buffer);
      rows = parsed.rows;
      moduleId = String(req.body.moduleId ?? "").trim();
      const mappingStr = req.body.mapping;
      mapping = typeof mappingStr === "string" ? JSON.parse(mappingStr) : req.body.mapping ?? {};
      useJobQueue = req.body.useJobQueue === "true" || req.body.useJobQueue === true;
    } else {
      const body = runImportSchema.parse(req.body);
      moduleId = body.moduleId;
      mapping = body.mapping;
      useJobQueue = body.useJobQueue;
      const rowsPayload = (req.body as { rows?: Record<string, string>[] }).rows;
      if (!Array.isArray(rowsPayload)) {
        res.status(400).json({ error: "rows array or file required" });
        return;
      }
      rows = rowsPayload;
    }

    if (!moduleId || Object.keys(mapping).length === 0) {
      res.status(400).json({ error: "moduleId and mapping required" });
      return;
    }

    const result = await importExportService.runImport(tenantId, moduleId, mapping, rows, createdBy, {
      useJobQueue: useJobQueue ?? rows.length > 200,
    });

    if (result.jobId) {
      res.status(202).json({ jobId: result.jobId, message: "Import queued" });
      return;
    }
    res.json({
      successCount: result.successCount ?? 0,
      errorCount: result.errorCount ?? 0,
      errors: result.errors?.slice(0, 50),
    });
  } catch (e) {
    next(e);
  }
});

/** GET /import/jobs — list import jobs */
router.get("/jobs", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const jobs = await importExportService.listImportJobs(tenantId, limit);
    res.json(jobs);
  } catch (e) {
    next(e);
  }
});

/** GET /import/jobs/:id — get import job status */
router.get("/jobs/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const job = await importExportService.getImportJob(tenantId, req.params.id);
    res.json(job);
  } catch (e) {
    next(e);
  }
});

/** GET /import/fields/:moduleId — get module fields for mapping */
router.get("/fields/:moduleId", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const result = await importExportService.getModuleFieldsForImport(tenantId, req.params.moduleId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** GET /download — export module records as CSV or Excel. Query: moduleId, format=csv|excel, fields=key1,key2 */
router.get("/download", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const query = exportQuerySchema.parse(req.query);
    const fieldKeys = query.fields ? query.fields.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const buffer = await importExportService.exportModuleRecords(
      tenantId,
      query.moduleId,
      query.format,
      fieldKeys
    );
    const contentType = query.format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const ext = query.format === "csv" ? "csv" : "xlsx";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="export.${ext}"`);
    res.send(buffer);
  } catch (e) {
    next(e);
  }
});

export default router;
