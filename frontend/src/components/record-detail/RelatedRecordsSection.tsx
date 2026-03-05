"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  recordRelationsApi,
  relationshipsApi,
  recordsApi,
  type RelatedRecordEntry,
  type ModuleRelationship,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Unlink, Plus } from "lucide-react";

export interface RelatedRecordsSectionProps {
  recordId: string;
  moduleId: string;
  onUnlink?: () => void;
}

function displayTitle(values: Record<string, unknown>): string {
  const name = values["name"] ?? values["title"] ?? values["email"];
  if (name != null) return String(name);
  const first = Object.values(values).find((v) => v != null && v !== "");
  return first != null ? String(first) : "—";
}

export function RelatedRecordsSection({ recordId, moduleId, onUnlink }: RelatedRecordsSectionProps) {
  const [related, setRelated] = useState<RelatedRecordEntry[]>([]);
  const [relationships, setRelationships] = useState<ModuleRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkModal, setLinkModal] = useState<{ relationshipId: string; relationshipName: string; otherModuleId: string; isSource: boolean } | null>(null);
  const [candidates, setCandidates] = useState<{ id: string; values: Record<string, unknown> }[]>([]);
  const [linking, setLinking] = useState(false);
  const [linkMenuOpen, setLinkMenuOpen] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      recordRelationsApi.getRelated(recordId),
      relationshipsApi.list(moduleId),
    ])
      .then(([relList, rels]) => {
        setRelated(relList);
        setRelationships(rels);
      })
      .catch(() => {
        setRelated([]);
        setRelationships([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [recordId, moduleId]);

  const grouped = related.reduce(
    (acc, entry) => {
      const key = entry.relationshipId;
      if (!acc[key]) acc[key] = { name: entry.relationshipName, type: entry.relationshipType, entries: [] };
      acc[key].entries.push(entry);
      return acc;
    },
    {} as Record<string, { name: string; type: string; entries: RelatedRecordEntry[] }>
  );

  const openLinkModal = (rel: ModuleRelationship) => {
    const isSource = rel.sourceModuleId === moduleId;
    const otherModuleId = isSource ? rel.targetModuleId : rel.sourceModuleId;
    setLinkModal({
      relationshipId: rel.id,
      relationshipName: rel.name,
      otherModuleId,
      isSource,
    });
    recordsApi.list(otherModuleId, { limit: 100 }).then((r) => setCandidates(r.items));
  };

  const closeLinkModal = () => {
    setLinkModal(null);
    setCandidates([]);
  };

  const linkRecord = async (targetRecordId: string) => {
    if (!linkModal) return;
    setLinking(true);
    try {
      const sourceRecordId = linkModal.isSource ? recordId : targetRecordId;
      const trgId = linkModal.isSource ? targetRecordId : recordId;
      await recordRelationsApi.link({
        relationshipId: linkModal.relationshipId,
        sourceRecordId,
        targetRecordId: trgId,
      });
      closeLinkModal();
      load();
      onUnlink?.();
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (relationId: string) => {
    try {
      await recordRelationsApi.unlink(relationId);
      load();
      onUnlink?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unlink failed");
    }
  };

  if (loading && related.length === 0 && relationships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Related records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Related records
          </CardTitle>
          {relationships.length > 0 && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLinkMenuOpen((o) => !o)}
                title="Link record"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {linkMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLinkMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded border bg-card py-1 shadow">
                    {relationships.map((rel) => (
                      <button
                        key={rel.id}
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setLinkMenuOpen(false);
                          openLinkModal(rel);
                        }}
                      >
                        Link to {rel.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(grouped).length === 0 && relationships.length === 0 && (
            <p className="text-sm text-muted-foreground">No relationships defined for this module.</p>
          )}
          {Object.keys(grouped).length === 0 && relationships.length > 0 && (
            <p className="text-sm text-muted-foreground">No linked records. Use + to link.</p>
          )}
          {Object.entries(grouped).map(([relId, { name, type, entries }]) => (
            <div key={relId} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {name}
                  <span className="ml-1 text-xs">({type.replace("_", "-")})</span>
                </span>
                <Button variant="ghost" size="sm" className="h-7" onClick={() => openLinkModal(relationships.find((r) => r.id === relId)!)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <ul className="space-y-1">
                {entries.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-sm">
                    <Link href={`/record/${entry.relatedRecord.id}`} className="truncate hover:underline">
                      {displayTitle(entry.relatedRecord.values)}
                    </Link>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleUnlink(entry.id)} title="Unlink">
                      <Unlink className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeLinkModal}>
          <div className="bg-card rounded-lg shadow-lg max-h-[80vh] w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h3 className="font-semibold">Link record — {linkModal.relationshipName}</h3>
              <p className="text-sm text-muted-foreground">Select a record to link</p>
            </div>
            <ul className="overflow-auto flex-1 p-2 space-y-1">
              {candidates.map((rec) => (
                <li key={rec.id}>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => linkRecord(rec.id)}
                    disabled={linking}
                  >
                    {displayTitle(rec.values)}
                  </Button>
                </li>
              ))}
            </ul>
            <div className="p-2 border-t">
              <Button variant="ghost" size="sm" onClick={closeLinkModal}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
