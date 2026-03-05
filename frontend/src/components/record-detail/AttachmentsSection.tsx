"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Plus } from "lucide-react";

/** Attachments stored as array of { name: string; url: string } in record values */
export type AttachmentItem = { name?: string; url: string };

export interface AttachmentsSectionProps {
  /** Current attachments (from record.values.attachments or record.values.files) */
  value: AttachmentItem[] | string | unknown;
  /** Field key for attachments, e.g. "attachments" or "files" */
  fieldKey: string;
  onSave: (fieldKey: string, value: AttachmentItem[]) => Promise<void>;
  className?: string;
}

function parseAttachments(value: AttachmentItem[] | string | unknown): AttachmentItem[] {
  if (Array.isArray(value)) {
    return value.filter((x) => x && typeof x === "object" && "url" in x) as AttachmentItem[];
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as AttachmentItem[]) : [];
    } catch {
      return value ? [{ url: value, name: "File" }] : [];
    }
  }
  return [];
}

export function AttachmentsSection({ value, fieldKey, onSave, className }: AttachmentsSectionProps) {
  const [items, setItems] = useState<AttachmentItem[]>(() => parseAttachments(value));
  const [saving, setSaving] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  useEffect(() => setItems(parseAttachments(value)), [value]);

  const handleAdd = () => {
    const url = newUrl.trim();
    if (!url) return;
    setItems((prev) => [...prev, { url, name: url.split("/").pop() || "File" }]);
    setNewUrl("");
  };

  const handleRemove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(fieldKey, items);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(items) !== JSON.stringify(parseAttachments(value));

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Paperclip className="h-4 w-4" />
          Attachments
        </CardTitle>
        {hasChanges && (
          <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Paste file URL..."
            className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <Button type="button" size="sm" variant="outline" onClick={handleAdd} className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No attachments. Add a URL above.</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((a, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-sm"
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {a.name || a.url}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  onClick={() => handleRemove(i)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
