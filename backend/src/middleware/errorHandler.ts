import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: Error & { statusCode?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    res.status(400).json({ error: "Validation failed", details: message });
    return;
  }
  if (err.name === "PermissionDeniedError" || err.message === "Access denied" || err.message === "No view access to this module" || err.message === "No view access to this record" || err.message === "No create access to this module" || err.message === "No edit access to this record" || err.message === "No delete access to this record" || err.message === "No permission to create modules" || err.message === "No permission to update modules" || err.message === "No permission to delete modules") {
    res.status(403).json({ error: err.message });
    return;
  }
  if (err.message === "Tenant not found" || err.message === "Module not found" || err.message === "Field not found" || err.message === "Record not found" || err.message === "Pipeline not found" || err.message === "Task not found" || err.message === "Automation not found" || err.message === "Dashboard not found" || err.message === "Widget not found" || err.message === "Relationship not found" || err.message === "Link not found" || err.message === "Role not found") {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err.message?.includes("Invalid") || err.message?.includes("already exists")) {
    res.status(400).json({ error: err.message });
    return;
  }
  const errWithDup = err as Error & { duplicates?: Record<string, string[]> };
  if (err.message === "Duplicate records found" && errWithDup.duplicates) {
    res.status(409).json({ error: err.message, duplicates: errWithDup.duplicates });
    return;
  }
  const status = err.statusCode ?? 500;
  const message = err.message ?? "Internal server error";
  res.status(status).json({ error: message });
}
