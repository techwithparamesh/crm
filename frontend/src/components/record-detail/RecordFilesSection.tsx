"use client";

import { useState, useEffect, useRef } from "react";
import { Paperclip, Upload, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { filesApi, type FileItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function resolveFileUrl(fileUrl: string): string {
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${API_BASE}${fileUrl}`;
}

export interface RecordFilesSectionProps {
  recordId: string;
  className?: string;
}

export function RecordFilesSection({ recordId, className }: RecordFilesSectionProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    filesApi
      .listByRecord(recordId)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [recordId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const created = await filesApi.upload(recordId, file);
      setFiles((prev) => [created, ...prev]);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this file?")) return;
    setDeletingId(id);
    try {
      await filesApi.delete(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Paperclip className="h-4 w-4" />
          Files
        </CardTitle>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files yet. Upload to attach files to this record.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2 rounded border px-2 py-1.5 text-sm group"
              >
                <span className="flex-1 truncate" title={f.fileName}>
                  {f.fileName}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={resolveFileUrl(f.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Open file"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(f.id)}
                    disabled={deletingId === f.id}
                    aria-label="Remove file"
                  >
                    {deletingId === f.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {files.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
