"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { importExportApi, modulesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, CheckCircle, Loader2 } from "lucide-react";

type Step = "upload" | "map" | "result";

export default function ImportPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);
  const [fields, setFields] = useState<{ id: string; fieldKey: string; label: string; fieldType: string; isRequired: boolean }[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ jobId?: string; successCount?: number; errorCount?: number; errors?: string[] } | null>(null);
  const [jobPolling, setJobPolling] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
  };

  const parseFile = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const data = await importExportApi.parseCsv(file);
      setHeaders(data.headers);
      setRowCount(data.rowCount);
      setSampleRows(data.sampleRows);
      const fieldsData = await importExportApi.getFieldsForImport(moduleId);
      setFields(fieldsData.fields);
      setMapping({});
      setStep("map");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse CSV");
    } finally {
      setLoading(false);
    }
  }, [file, moduleId]);

  const setMappingForColumn = (csvCol: string, fieldKey: string) => {
    if (!fieldKey) {
      const next = { ...mapping };
      delete next[csvCol];
      setMapping(next);
      return;
    }
    setMapping((m) => ({ ...m, [csvCol]: fieldKey }));
  };

  const runImport = async () => {
    if (!file) return;
    const mapped = Object.entries(mapping).filter(([, key]) => key);
    if (mapped.length === 0) {
      setError("Map at least one column to a field");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const useQueue = rowCount > 200;
      const res = await importExportApi.runImportWithFile(file, moduleId, mapping, useQueue);
      setResult(res);
      if (res.jobId) {
        setJobPolling(true);
        pollJob(res.jobId);
      } else {
        setStep("result");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const pollJob = (jobId: string) => {
    const t = setInterval(async () => {
      try {
        const job = await importExportApi.getImportJob(jobId);
        if (job.status === "completed" || job.status === "failed") {
          clearInterval(t);
          setJobPolling(false);
          setResult({
            successCount: job.successCount,
            errorCount: job.errorCount,
            errors: job.errorMessage ? [job.errorMessage] : undefined,
          });
          setStep("result");
        }
      } catch {
        clearInterval(t);
        setJobPolling(false);
      }
    }, 2000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/records/${moduleId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Import CSV</h1>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <p className="text-sm text-muted-foreground">Upload a CSV file. Next you will map its columns to module fields.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>CSV file</Label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="mt-2 block w-full text-sm"
              />
              {file && <p className="text-sm text-muted-foreground mt-1">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
            </div>
            <Button onClick={parseFile} disabled={!file || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Parse and map columns
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle>Map columns to fields</CardTitle>
            <p className="text-sm text-muted-foreground">{rowCount} rows detected. Match each CSV column to a CRM field.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {headers.map((col) => (
                <div key={col} className="flex items-center gap-4">
                  <span className="w-48 truncate text-sm font-medium">{col}</span>
                  <span className="text-muted-foreground">→</span>
                  <select
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={mapping[col] ?? ""}
                    onChange={(e) => setMappingForColumn(col, e.target.value)}
                  >
                    <option value="">— Skip —</option>
                    {fields.map((f) => (
                      <option key={f.id} value={f.fieldKey}>
                        {f.label} ({f.fieldType}){f.isRequired ? " *" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={runImport} disabled={loading || jobPolling}>
                {loading || jobPolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {jobPolling ? "Importing…" : rowCount > 200 ? "Start import (background)" : "Import now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "result" && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Imported:</strong> {result.successCount ?? 0}</p>
            {(result.errorCount ?? 0) > 0 && <p className="text-amber-600"><strong>Errors:</strong> {result.errorCount}</p>}
            {result.errors && result.errors.length > 0 && (
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{result.errors.join("\n")}</pre>
            )}
            <Button onClick={() => router.push(`/records/${moduleId}`)}>View records</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
