"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { recordsApi, modulesApi, importExportApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { canAccessModule } from "@/lib/permissions";
import { getModuleDescription } from "@/lib/module-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveTable } from "@/components/tables";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecordListItem } from "@/lib/api";
import { ArrowLeft, Plus, Download, Upload, Search, Filter, LayoutList } from "lucide-react";

const PAGE_SIZE = 50;

export default function RecordsListPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const user = useAuthStore((s) => s.user);
  const canCreate = canAccessModule(user?.permissions ?? null, moduleId, "create");
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("csv");
  const [exportFields, setExportFields] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const { data: moduleData, isPending: moduleLoading } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => modulesApi.get(moduleId),
    enabled: !!moduleId,
  });

  const { data: listData, isLoading: loading } = useQuery({
    queryKey: ["records", moduleId, page],
    queryFn: () => recordsApi.list(moduleId, { page, limit: PAGE_SIZE }),
    enabled: !!moduleId,
  });

  const data = listData
    ? { items: listData.items, total: listData.total, page: listData.page, limit: listData.limit }
    : null;
  const isEmpty = !loading && data && data.total === 0;

  const toggleExportField = (key: string) => {
    setExportFields((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };
  const selectAllExportFields = () => {
    setExportFields(moduleData?.fields.map((f) => f.fieldKey) ?? []);
  };
  const handleExport = async () => {
    setExporting(true);
    try {
      await importExportApi.downloadExport(moduleId, exportFormat, exportFields.length > 0 ? exportFields : undefined);
      setExportOpen(false);
    } finally {
      setExporting(false);
    }
  };

  if (moduleLoading || !moduleData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href={`/modules/${moduleId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{moduleData.name}</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? 0} records</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/records/${moduleId}/import`}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Link>
          </Button>
          <Button variant="outline" onClick={() => { setExportFields(moduleData.fields.map((f) => f.fieldKey)); setExportOpen(true); }}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {canCreate && (
            <Button asChild>
              <Link href={`/records/${moduleId}/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add {moduleData.name.endsWith("s") ? moduleData.name.slice(0, -1).toLowerCase() : moduleData.name.toLowerCase()}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters row: saved views + search + filter */}
      {!isEmpty && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 min-w-[200px]">
            <LayoutList className="h-4 w-4 text-muted-foreground shrink-0" />
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full max-w-[180px]" aria-label="Saved views">
              <option>All records</option>
            </select>
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search in list..." className="pl-8 h-9" readOnly />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      )}

      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setExportOpen(false)}>
          <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Export records</h2>
            <div>
              <label className="text-sm font-medium block mb-2">Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="format" checked={exportFormat === "csv"} onChange={() => setExportFormat("csv")} />
                  CSV
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="format" checked={exportFormat === "excel"} onChange={() => setExportFormat("excel")} />
                  Excel
                </label>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Fields to include</label>
                <button type="button" className="text-xs text-primary hover:underline" onClick={selectAllExportFields}>Select all</button>
              </div>
              <div className="max-h-48 overflow-auto border rounded p-2 space-y-1">
                {moduleData.fields.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={exportFields.includes(f.fieldKey)} onChange={() => toggleExportField(f.fieldKey)} />
                    <span className="text-sm">{f.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave all selected to export every field.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
              <Button onClick={handleExport} disabled={exporting}>
                {exporting ? "Exporting…" : "Download"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          icon={<LayoutList className="h-12 w-12 text-muted-foreground" />}
          title={`No ${moduleData.name.toLowerCase()} yet`}
          description={getModuleDescription(moduleData)}
          action={
            canCreate ? (
              <Button asChild>
                <Link href={`/records/${moduleId}/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add first {moduleData.name.endsWith("s") ? moduleData.name.slice(0, -1).toLowerCase() : moduleData.name.toLowerCase()}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ResponsiveTable
          moduleId={moduleId}
          fields={moduleData.fields}
          page={data?.page ?? 1}
          limit={data?.limit ?? PAGE_SIZE}
          total={data?.total ?? 0}
          items={data?.items ?? []}
          loading={loading}
          onPageChange={setPage}
          recordDetailPath="/record"
        />
      )}
    </div>
  );
}
