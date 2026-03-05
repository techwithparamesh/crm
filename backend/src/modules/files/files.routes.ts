import { Router } from "express";
import multer from "multer";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { tenantMiddleware } from "../../middleware/tenantMiddleware.js";
import * as filesService from "./files.service.js";
import { listFilesQuerySchema } from "./files.validation.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

/** POST /files/upload — multipart: file, recordId (field or in body after) */
router.post(
  "/upload",
  authMiddleware,
  tenantMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      const uploadedBy = req.user!.id !== "api" ? req.user!.id : null;
      const recordId = (req.body?.recordId ?? req.body?.record_id) as string | undefined;
      if (!recordId?.trim()) {
        res.status(400).json({ error: "recordId is required" });
        return;
      }
      const f = req.file;
      if (!f?.buffer) {
        res.status(400).json({ error: "File is required" });
        return;
      }
      const fileName = f.originalname || "file";
      const file = await filesService.saveFile(
        tenantId,
        recordId.trim(),
        fileName,
        f.buffer,
        f.mimetype,
        uploadedBy
      );
      res.status(201).json({
        id: file.id,
        tenantId: file.tenantId,
        recordId: file.recordId,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        uploadedBy: file.uploadedBy,
        createdAt: file.createdAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

/** GET /files?recordId=... — list files for a record */
router.get("/", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const query = listFilesQuerySchema.parse({ recordId: req.query.recordId });
    const list = await filesService.listByRecord(tenantId, query.recordId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/** DELETE /files/:id */
router.delete("/:id", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await filesService.deleteFile(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
