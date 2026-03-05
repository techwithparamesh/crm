"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { recordsApi } from "@/lib/api";
import type { Field, RecordListItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Columns, Search } from "lucide-react";

export interface DynamicRecordTableProps {
  moduleId: string;
  fields: Field[];
  page: number;
  limit: number;
  total: number;
  items: RecordListItem[];
  loading?: boolean;
  onPageChange: (page: number) => void;
  /** Base path for record detail, e.g. "" for /record/[id] */
  recordDetailPath?: string;
}

function formatCellValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function DynamicRecordTable({
  moduleId,
  fields,
  page,
  limit,
  total,
  items,
  loading = false,
  onPageChange,
  recordDetailPath = "/record",
}: DynamicRecordTableProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibilityOpen, setColumnVisibilityOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<RecordListItem>[]>(() => {
    const cols: ColumnDef<RecordListItem>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => el && (el.indeterminate = table.getIsSomePageRowsSelected())}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
      },
      ...fields.map((field) => ({
        id: field.fieldKey,
        accessorFn: (row: RecordListItem) => row.values[field.fieldKey],
        header: field.label,
        cell: ({ getValue }: { getValue: () => unknown }) => formatCellValue(getValue()),
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: (row, _columnId, filterValue: string) => {
          const v = row.getValue(field.fieldKey);
          const s = formatCellValue(v).toLowerCase();
          return !filterValue || s.includes(String(filterValue).toLowerCase());
        },
      })),
    ];
    return cols as ColumnDef<RecordListItem>[];
  }, [fields]);

  const table = useReactTable({
    data: items,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalPages = Math.ceil(total / limit) || 1;
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <Card>
      <CardContent className="p-0">
        {/* Toolbar: global search, column visibility */}
        <div className="flex flex-wrap items-center gap-3 p-3 border-b bg-muted/30">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColumnVisibilityOpen((o) => !o)}
              className="gap-1"
            >
              <Columns className="h-4 w-4" />
              Columns
              <ChevronDown className="h-4 w-4" />
            </Button>
            {columnVisibilityOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setColumnVisibilityOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-md border bg-card py-2 shadow-lg">
                  {table.getAllLeafColumns().map((col) => {
                    if (col.id === "select") return null;
                    return (
                      <label
                        key={col.id}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input"
                          checked={col.getIsVisible()}
                          onChange={col.getToggleVisibilityHandler()}
                        />
                        {col.column.columnDef.header as string}
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Column filter row (optional) */}
        <div className="flex border-b bg-muted/20">
          <div className="w-[40px] shrink-0" />
          {table.getHeaderGroups()[0]?.headers.map((header) => {
            if (header.column.id === "select") return null;
            const col = header.column;
            if (!col.getCanFilter()) return <div key={header.id} className="flex-1 min-w-[100px] p-1" />;
            return (
              <div key={header.id} className="flex-1 min-w-[100px] p-1">
                <Input
                  placeholder={`Filter ${col.columnDef.header as string}...`}
                  value={(col.getFilterValue() as string) ?? ""}
                  onChange={(e) => col.setFilterValue(e.target.value)}
                  className="h-8 text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-muted/50">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "text-left p-3 font-medium whitespace-nowrap",
                          canSort && "cursor-pointer select-none hover:bg-muted/70"
                        )}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (() => {
                            const dir = header.column.getIsSorted();
                            return dir === "asc" ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : dir === "desc" ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : null;
                          })()}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-6 text-center text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No records.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b hover:bg-muted/30 transition-colors",
                      row.getIsSelected() && "bg-primary/5"
                    )}
                    onClick={() => router.push(`${recordDetailPath}/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-4 p-3 border-t">
          <p className="text-sm text-muted-foreground">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
