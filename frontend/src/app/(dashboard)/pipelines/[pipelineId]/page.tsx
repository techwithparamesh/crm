"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { pipelinesApi, recordsApi, modulesApi } from "@/lib/api";
import { KanbanBoard } from "@/components/kanban";
import { Button } from "@/components/ui/button";
import type { PipelineWithStages } from "@/lib/api";
import type { RecordListItem } from "@/lib/api";
import type { ModuleWithFields } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function PipelineKanbanPage() {
  const params = useParams();
  const pipelineId = params.pipelineId as string;
  const [pipeline, setPipeline] = useState<PipelineWithStages | null>(null);
  const [moduleData, setModuleData] = useState<ModuleWithFields | null>(null);
  const [recordsByStage, setRecordsByStage] = useState<Record<string, RecordListItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    pipelinesApi
      .get(pipelineId)
      .then((p) => {
        setPipeline(p);
        if (p.moduleId) {
          return Promise.all([
            recordsApi.list(p.moduleId, { limit: 100 }),
            modulesApi.get(p.moduleId),
          ]).then(([res, mod]) => {
            setModuleData(mod);
            const byStage: Record<string, RecordListItem[]> = { __none__: [] };
            for (const stage of p.stages) byStage[stage.id] = [];
            for (const rec of res.items) {
              const sid = rec.stage?.id ?? "__none__";
              if (!byStage[sid]) byStage[sid] = [];
              byStage[sid].push(rec);
            }
            setRecordsByStage(byStage);
          });
        }
      })
      .catch(() => setPipeline(null))
      .finally(() => setLoading(false));
  }, [pipelineId]);

  if (!pipeline) return <p className="text-muted-foreground">Loading...</p>;

  const displayFieldKeys =
    moduleData?.fields
      .slice(0, 3)
      .map((f) => f.fieldKey) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/pipelines">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold truncate">{pipeline.name}</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading records...</p>
      ) : (
        <KanbanBoard
          pipeline={pipeline}
          recordsByStage={recordsByStage}
          displayFieldKeys={displayFieldKeys}
          onRecordsChange={setRecordsByStage}
          recordDetailPath="/record"
        />
      )}
    </div>
  );
}
