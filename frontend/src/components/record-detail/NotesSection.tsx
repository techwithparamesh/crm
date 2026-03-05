"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Save } from "lucide-react";

export interface NotesSectionProps {
  value: string;
  fieldKey: string;
  onSave: (fieldKey: string, value: string) => Promise<void>;
  className?: string;
}

export function NotesSection({ value, fieldKey, onSave, className }: NotesSectionProps) {
  const [local, setLocal] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setLocal(value), [value]);
  const isDirty = local !== value;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(fieldKey, local);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          Notes
        </CardTitle>
        {isDirty && (
          <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saving}>
            <Save className="h-3 w-3 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <textarea
          className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Add notes about this record..."
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
      </CardContent>
    </Card>
  );
}
