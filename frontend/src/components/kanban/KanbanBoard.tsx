"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { recordsApi } from "@/lib/api";
import type { PipelineWithStages } from "@/lib/api";
import type { RecordListItem } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STAGE_NONE = "__none__";

export interface KanbanBoardProps {
  pipeline: PipelineWithStages;
  /** Records grouped by stage id (or __none__ for no stage) */
  recordsByStage: Record<string, RecordListItem[]>;
  /** Field keys to show on cards (e.g. ["name", "email"]). If empty, first 2 values are shown. */
  displayFieldKeys?: string[];
  /** Called after a record is moved; use to refresh recordsByStage */
  onRecordsChange?: (recordsByStage: Record<string, RecordListItem[]>) => void;
  recordDetailPath?: string;
  className?: string;
}

function formatCardValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function RecordCardContent({
  record,
  displayFieldKeys,
}: {
  record: RecordListItem;
  displayFieldKeys?: string[];
}) {
  const values = record.values;
  const keys = displayFieldKeys?.length
    ? displayFieldKeys.filter((k) => k in values)
    : Object.keys(values).slice(0, 3);
  return (
    <>
      {keys.length > 0 ? (
        keys.map((k) => (
          <p key={k} className="text-xs text-muted-foreground truncate">
            {formatCardValue(values[k])}
          </p>
        ))
      ) : (
        <p className="text-sm font-medium truncate">
          {formatCardValue(Object.values(values)[0]) || record.id.slice(0, 8)}
        </p>
      )}
    </>
  );
}

function KanbanCard({
  record,
  displayFieldKeys,
  isDragging,
  onClick,
  className,
}: {
  record: RecordListItem;
  displayFieldKeys?: string[];
  isDragging?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const title = formatCardValue(Object.values(record.values)[0]) || "Record";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
      className={cn(
        "rounded-md border bg-card p-3 text-sm cursor-pointer transition-shadow hover:bg-muted/50 hover:shadow-sm",
        isDragging && "opacity-90 shadow-lg ring-2 ring-primary/20",
        className
      )}
    >
      <p className="font-medium truncate mb-1">{title}</p>
      <RecordCardContent record={record} displayFieldKeys={displayFieldKeys} />
    </div>
  );
}

function DroppableColumn({
  id,
  title,
  count,
  records,
  displayFieldKeys,
  recordDetailPath,
  isOver,
}: {
  id: string;
  title: string;
  count: number;
  records: RecordListItem[];
  displayFieldKeys?: string[];
  recordDetailPath: string;
  isOver?: boolean;
}) {
  const router = useRouter();
  const { setNodeRef, isOver: isDroppableOver } = useDroppable(id);
  const active = isOver ?? isDroppableOver;

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "min-w-[260px] w-[260px] sm:min-w-[280px] sm:w-[280px] flex-shrink-0 flex flex-col max-h-[calc(100vh-11rem)] sm:max-h-[calc(100vh-12rem)] transition-colors snap-start",
        active && "ring-2 ring-primary/30 bg-primary/5"
      )}
    >
      <CardHeader className="py-3 flex-shrink-0">
        <h3 className="font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{count} records</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-0 space-y-2 min-h-[80px]">
        {records.map((rec) => (
          <DraggableCard
            key={rec.id}
            record={rec}
            displayFieldKeys={displayFieldKeys}
            recordDetailPath={recordDetailPath}
            onOpen={() => router.push(`${recordDetailPath}/${rec.id}`)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function DraggableCard({
  record,
  displayFieldKeys,
  recordDetailPath,
  onOpen,
}: {
  record: RecordListItem;
  displayFieldKeys?: string[];
  recordDetailPath: string;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: record.id,
    data: { type: "record", recordId: record.id, record },
  });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <KanbanCard
        record={record}
        displayFieldKeys={displayFieldKeys}
        isDragging={isDragging}
        onClick={onOpen}
      />
    </div>
  );
}

export function KanbanBoard({
  pipeline,
  recordsByStage,
  displayFieldKeys,
  onRecordsChange,
  recordDetailPath = "/record",
  className,
}: KanbanBoardProps) {
  const [activeRecord, setActiveRecord] = React.useState<RecordListItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const rec = Object.values(recordsByStage).flat().find((r) => r.id === active.id);
    if (rec) setActiveRecord(rec);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveRecord(null);
    const { active, over } = event;
    if (!over) return;
    const recordId = active.id as string;
    const newStageId = over.id as string;
    const currentRecord = Object.values(recordsByStage).flat().find((r) => r.id === recordId);
    const currentStageId = currentRecord?.stage?.id ?? (currentRecord ? STAGE_NONE : null);
    if (!currentRecord || newStageId === currentStageId) return;
    if (newStageId !== STAGE_NONE && !pipeline.stages.some((s) => s.id === newStageId)) return;

    try {
      if (newStageId === STAGE_NONE) {
        await recordsApi.update(recordId, { pipelineStageId: null });
      } else {
        await recordsApi.updateStage(recordId, newStageId);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Move failed");
      return;
    }

    const next = { ...recordsByStage };
    for (const sid of Object.keys(next)) {
      next[sid] = next[sid].filter((r) => r.id !== recordId);
    }
    const newStage = newStageId === STAGE_NONE ? null : pipeline.stages.find((s) => s.id === newStageId) ?? null;
    const moved: RecordListItem = { ...currentRecord, stage: newStage ?? undefined };
    next[newStageId] = [...(next[newStageId] ?? []), moved];
    onRecordsChange?.(next);
  };

  const stages = [
    { id: STAGE_NONE, stageName: "No stage", orderIndex: -1 },
    ...pipeline.stages,
  ];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "flex gap-4 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6",
          "snap-x snap-mandatory md:snap-none",
          "touch-pan-x",
          className
        )}
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {stages.map((stage) => (
          <DroppableColumn
            key={stage.id}
            id={stage.id}
            title={stage.stageName}
            count={(recordsByStage[stage.id] ?? []).length}
            records={recordsByStage[stage.id] ?? []}
            displayFieldKeys={displayFieldKeys}
            recordDetailPath={recordDetailPath}
          />
        ))}
      </div>

      <DragOverlay>
        {activeRecord ? (
          <div className="w-[260px]">
            <KanbanCard
              record={activeRecord}
              displayFieldKeys={displayFieldKeys}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
