"use client";

import { cn } from "@/lib/utils";
import type { WhatsAppConversation } from "@/lib/api";
import { MessageCircle } from "lucide-react";

export interface ConversationListProps {
  conversations: WhatsAppConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  loading,
  emptyMessage = "No conversations",
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (conversations.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return (
    <ul className="space-y-1">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              selectedId === c.id
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted"
            )}
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">+{c.phoneNumber}</span>
            {c.messages?.[0] && (
              <span className="ml-auto text-xs text-muted-foreground truncate max-w-[120px]">
                {String(c.messages[0].messageBody).slice(0, 20)}…
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
