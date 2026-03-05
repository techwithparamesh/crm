"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MobileRecordCard } from "./MobileRecordCard";
import type { RecordListItem, Field } from "@/lib/api";

const ROW_HEIGHT = 140;

export interface VirtualizedRecordCardListProps {
  items: RecordListItem[];
  fields: Field[];
  recordDetailPath?: string;
  /** Min height of scroll container (px). */
  minHeight?: number;
}

/**
 * Virtualized list for mobile record cards. Use when there are many items to avoid DOM bloat.
 */
export function VirtualizedRecordCardList({
  items,
  fields,
  recordDetailPath = "/record",
  minHeight = 400,
}: VirtualizedRecordCardListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="overflow-auto w-full"
      style={{ minHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const record = items[virtualRow.index];
          return (
            <div
              key={record.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: "0.75rem",
              }}
            >
              <MobileRecordCard
                record={record}
                fields={fields}
                recordDetailPath={recordDetailPath}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
