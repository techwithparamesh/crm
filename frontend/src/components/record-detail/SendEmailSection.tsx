"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { emailApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SendEmailSectionProps {
  recordId: string;
  /** Optional initial "to" (e.g. from record email field) */
  defaultTo?: string;
  onSent?: () => void;
}

export function SendEmailSection({ recordId, defaultTo = "", onSent }: SendEmailSectionProps) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!to.trim()) {
      setError("Recipient is required");
      return;
    }
    setError("");
    setSending(true);
    try {
      await emailApi.send({
        to: to.trim(),
        subject: subject.trim() || "(No subject)",
        body: body.trim() || "",
        recordId,
      });
      setOpen(false);
      setTo("");
      setSubject("");
      setBody("");
      onSent?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
            Send email
          </Button>
        </CardContent>
      </Card>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Send email</h2>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Message body..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => !sending && setOpen(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
