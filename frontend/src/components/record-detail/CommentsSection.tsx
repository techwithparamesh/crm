"use client";

import { useState, useEffect } from "react";
import { commentsApi, type CommentItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

export interface CommentsSectionProps {
  recordId: string;
  onCommentAdded?: () => void;
}

export function CommentsSection({ recordId, onCommentAdded }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    commentsApi
      .list(recordId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [recordId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const created = await commentsApi.create(recordId, text);
      setComments((prev) => [...prev, created]);
      setMessage("");
      onCommentAdded?.();
    } catch {
      // show error in UI if needed
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await commentsApi.delete(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px]"
            disabled={submitting}
          />
          <Button type="submit" disabled={!message.trim() || submitting}>
            Post
          </Button>
        </form>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-sm">{c.user.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{formatDate(c.createdAt)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-8 text-xs"
                    onClick={() => handleDelete(c.id)}
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{c.message}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
