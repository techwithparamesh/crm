"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import type { WhatsAppTemplate } from "@/lib/api";

export interface TemplateSelectorProps {
  templates: WhatsAppTemplate[];
  phoneNumber: string;
  recordId?: string | null;
  conversationId?: string | null;
  recordValues?: Record<string, unknown>;
  onSent: () => void;
  sendTemplate: (body: {
    phoneNumber: string;
    templateId: string;
    variables?: Record<string, string>;
    recordId?: string | null;
    conversationId?: string | null;
  }) => Promise<unknown>;
  disabled?: boolean;
}

function parseVariables(body: string): string[] {
  const matches = body.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
  const names = new Set<string>();
  matches.forEach((m) => {
    const name = m.replace(/\{\{|\}\}/g, "").trim();
    if (name) names.add(name);
  });
  return Array.from(names);
}

export function TemplateSelector({
  templates,
  phoneNumber,
  recordId,
  conversationId,
  recordValues = {},
  onSent,
  sendTemplate,
  disabled,
}: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<WhatsAppTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const variableNames = selected ? parseVariables(selected.templateBody) : [];

  const handleSend = async () => {
    if (!selected || !phoneNumber.trim()) return;
    setError("");
    setSending(true);
    try {
      await sendTemplate({
        phoneNumber: phoneNumber.trim(),
        templateId: selected.id,
        variables,
        recordId: recordId ?? undefined,
        conversationId: conversationId ?? undefined,
      });
      onSent();
      setOpen(false);
      setSelected(null);
      setVariables({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || templates.length === 0}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Use template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Template</Label>
            <select
              className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3"
              value={selected?.id ?? ""}
              onChange={(e) => {
                const t = templates.find((x) => x.id === e.target.value) ?? null;
                setSelected(t);
                const names = t ? parseVariables(t.templateBody) : [];
                const next: Record<string, string> = {};
                names.forEach((n) => {
                  next[n] = String(recordValues[n] ?? variables[n] ?? "");
                });
                setVariables(next);
              }}
            >
              <option value="">Select...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          {selected && variableNames.length > 0 && (
            <div className="space-y-2">
              <Label>Variables</Label>
              {variableNames.map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <Label className="w-24 text-muted-foreground shrink-0">{name}</Label>
                  <Input
                    value={variables[name] ?? ""}
                    onChange={(e) => setVariables((v) => ({ ...v, [name]: e.target.value }))}
                    placeholder={String(recordValues[name] ?? "") || `{{${name}}}`}
                  />
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending || !selected}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
