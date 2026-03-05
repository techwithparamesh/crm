"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Module } from "@/lib/api";
import { TRIGGER_OPTIONS } from "./types";
import { Zap } from "lucide-react";

export interface TriggerSelectorProps {
  triggerType: string;
  moduleId: string | null;
  modules: Module[];
  onTriggerChange: (value: string) => void;
  onModuleChange: (moduleId: string | null) => void;
}

export function TriggerSelector({
  triggerType,
  moduleId,
  modules,
  onTriggerChange,
  onModuleChange,
}: TriggerSelectorProps) {
  const needsModule = triggerType === "record_created" || triggerType === "record_updated" || triggerType === "stage_changed";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4" />
          When (trigger)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">Trigger event</label>
          <div className="flex flex-wrap gap-2">
            {TRIGGER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onTriggerChange(opt.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  triggerType === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {needsModule && (
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">Module (optional)</label>
            <select
              value={moduleId ?? ""}
              onChange={(e) => onModuleChange(e.target.value || null)}
              className="w-full max-w-xs rounded border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Any module</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
