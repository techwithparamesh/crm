"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

export interface MessageComposerProps {
  phoneNumber: string;
  recordId?: string | null;
  conversationId?: string | null;
  onSent: () => void;
  sendMessage: (body: {
    phoneNumber: string;
    messageBody: string;
    recordId?: string | null;
    conversationId?: string | null;
  }) => Promise<unknown>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageComposer({
  phoneNumber,
  recordId,
  conversationId,
  onSent,
  sendMessage,
  disabled,
  placeholder = "Type a message...",
}: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    const text = body.trim();
    if (!text || !phoneNumber.trim()) return;
    setError("");
    setSending(true);
    try {
      await sendMessage({
        phoneNumber: phoneNumber.trim(),
        messageBody: text,
        recordId: recordId ?? undefined,
        conversationId: conversationId ?? undefined,
      });
      setBody("");
      onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="resize-none"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        size="sm"
        onClick={handleSend}
        disabled={disabled || sending || !body.trim()}
        className="w-full sm:w-auto"
      >
        <Send className="h-4 w-4 mr-2" />
        {sending ? "Sending..." : "Send"}
      </Button>
    </div>
  );
}
