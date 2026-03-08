"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Mail, CheckSquare, FileText, MessageSquare, Paperclip } from "lucide-react";
import { ActivityTimeline } from "./ActivityTimeline";
import { RelatedTasks } from "./RelatedTasks";
import { NotesSection } from "./NotesSection";
import { SendEmailSection } from "./SendEmailSection";
import { RecordFilesSection } from "./RecordFilesSection";
import { CommentsSection } from "./CommentsSection";
import type { RecordDetail } from "@/lib/api";

export interface ActivityPanelProps {
  recordId: string;
  record: RecordDetail;
  notesValue: string;
  notesFieldKey: string;
  onNotesSave: (key: string, value: unknown) => Promise<void>;
  onCommentAdded?: () => void;
  activityRefreshKey?: number;
  defaultEmail?: string;
}

export function ActivityPanel({
  recordId,
  record,
  notesValue,
  notesFieldKey,
  onNotesSave,
  onCommentAdded,
  activityRefreshKey = 0,
  defaultEmail = "",
}: ActivityPanelProps) {
  return (
    <Card>
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto flex flex-wrap">
          <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="emails" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="files" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            <Paperclip className="h-3.5 w-3.5 mr-1.5" />
            Files
          </TabsTrigger>
        </TabsList>
        <CardContent className="pt-4">
          <TabsContent value="activity" className="mt-0">
            <ActivityTimeline recordId={recordId} record={record} refreshKey={activityRefreshKey} />
          </TabsContent>
          <TabsContent value="emails" className="mt-0">
            <SendEmailSection recordId={recordId} defaultTo={defaultEmail} onSent={() => onCommentAdded?.()} />
          </TabsContent>
          <TabsContent value="tasks" className="mt-0">
            <RelatedTasks recordId={recordId} />
          </TabsContent>
          <TabsContent value="notes" className="mt-0">
            <NotesSection value={notesValue} fieldKey={notesFieldKey} onSave={onNotesSave} />
          </TabsContent>
          <TabsContent value="comments" className="mt-0">
            <CommentsSection recordId={recordId} onCommentAdded={onCommentAdded} />
          </TabsContent>
          <TabsContent value="files" className="mt-0">
            <RecordFilesSection recordId={recordId} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
