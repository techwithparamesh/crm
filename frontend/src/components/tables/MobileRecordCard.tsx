"use client";

import { useRouter } from "next/navigation";
import type { Field, RecordListItem } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

function formatCellValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export interface MobileRecordCardProps {
  record: RecordListItem;
  fields: Field[];
  recordDetailPath?: string;
}

export function MobileRecordCard({
  record,
  fields,
  recordDetailPath = "/record",
}: MobileRecordCardProps) {
  const router = useRouter();
  const visibleFields = fields.filter((f) => record.values[f.fieldKey] != null && record.values[f.fieldKey] !== "");

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted/70"
      onClick={() => router.push(`${recordDetailPath}/${record.id}`)}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          {visibleFields.slice(0, 6).map((field) => (
            <div key={field.id} className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
              <span className="text-sm truncate">{formatCellValue(record.values[field.fieldKey])}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-2 pt-2 border-t">
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}
