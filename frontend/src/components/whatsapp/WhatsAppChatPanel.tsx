"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationList } from "./ConversationList";
import { MessageComposer } from "./MessageComposer";
import { TemplateSelector } from "./TemplateSelector";
import { cn } from "@/lib/utils";
import { whatsappApi, type WhatsAppMessage, type WhatsAppConversation } from "@/lib/api";
import { MessageSquare } from "lucide-react";

export interface WhatsAppChatPanelProps {
  recordId: string;
  /** Default phone from record (e.g. record.values.phone) */
  defaultPhone?: string;
  /** Optional: pre-selected conversation id */
  conversationId?: string | null;
  /** Record field values for template variable prefill */
  recordValues?: Record<string, unknown>;
}

export function WhatsAppChatPanel({
  recordId,
  defaultPhone = "",
  conversationId: initialConversationId,
  recordValues = {},
}: WhatsAppChatPanelProps) {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const [phoneInput, setPhoneInput] = useState(defaultPhone);

  const { data: conversations = [], isLoading: convLoading } = useQuery({
    queryKey: ["whatsapp-conversations", recordId],
    queryFn: () => whatsappApi.getConversations(recordId),
  });

  const { data: messages = [], isLoading: msgLoading } = useQuery({
    queryKey: ["whatsapp-messages", recordId, selectedConversationId],
    queryFn: () =>
      selectedConversationId
        ? whatsappApi.getMessages({ conversationId: selectedConversationId })
        : Promise.resolve([]),
    enabled: !!selectedConversationId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: () => whatsappApi.getTemplates(),
  });

  useEffect(() => {
    if (defaultPhone) setPhoneInput(defaultPhone);
  }, [defaultPhone]);

  const selectedConv = conversations.find((c) => c.id === selectedConversationId);
  const displayPhone = selectedConv?.phoneNumber
    ? `+${selectedConv.phoneNumber}`
    : phoneInput.trim() || "—";

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations", recordId] });
    queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", recordId, selectedConversationId] });
  };

  const activePhone = selectedConv?.phoneNumber ?? phoneInput.replace(/\D/g, "");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-5 w-5" />
          WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="conversations">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="send">Send message</TabsTrigger>
          </TabsList>
          <TabsContent value="conversations" className="mt-3 space-y-3">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
              loading={convLoading}
              emptyMessage="No WhatsApp conversations for this record."
            />
            {conversations.length > 0 && (
              <>
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-1">Messages</p>
                  {msgLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    <MessageList messages={messages} />
                  )}
                </div>
                <div className="space-y-2">
                  <TemplateSelector
                    templates={templates}
                    phoneNumber={activePhone ? `+${activePhone}` : phoneInput}
                    recordId={recordId}
                    conversationId={selectedConversationId}
                    recordValues={recordValues}
                    onSent={refresh}
                    sendTemplate={(body) => whatsappApi.sendTemplate(body)}
                    disabled={!activePhone && !phoneInput.trim()}
                  />
                  <MessageComposer
                    phoneNumber={activePhone ? `+${activePhone}` : phoneInput}
                    recordId={recordId}
                    conversationId={selectedConversationId}
                    onSent={refresh}
                    sendMessage={(body) => whatsappApi.send(body)}
                    disabled={!activePhone && !phoneInput.trim()}
                  />
                </div>
              </>
            )}
          </TabsContent>
          <TabsContent value="send" className="mt-3 space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Phone number</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Use a number from the record or enter one to start a new conversation.
            </p>
            <div className="space-y-2">
              <TemplateSelector
                templates={templates}
                phoneNumber={phoneInput}
                recordId={recordId}
                recordValues={recordValues}
                onSent={refresh}
                sendTemplate={(body) => whatsappApi.sendTemplate(body)}
                disabled={!phoneInput.trim()}
              />
              <MessageComposer
                phoneNumber={phoneInput}
                recordId={recordId}
                onSent={refresh}
                sendMessage={(body) => whatsappApi.send(body)}
                disabled={!phoneInput.trim()}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MessageList({ messages }: { messages: WhatsAppMessage[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No messages yet.</p>;
  }
  return (
    <div className="max-h-48 overflow-y-auto space-y-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn(
            "rounded-lg px-3 py-2 text-sm max-w-[85%]",
            m.direction === "outbound"
              ? "ml-auto bg-primary text-primary-foreground"
              : "mr-auto bg-muted"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{m.messageBody}</p>
          <p className="text-xs opacity-80 mt-1">
            {new Date(m.createdAt).toLocaleString()} · {m.status}
          </p>
        </div>
      ))}
    </div>
  );
}
