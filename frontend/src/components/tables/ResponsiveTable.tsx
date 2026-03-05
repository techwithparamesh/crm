"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { DynamicRecordTable } from "./DynamicRecordTable";
import { MobileRecordCard } from "./MobileRecordCard";
import { VirtualizedRecordCardList } from "./VirtualizedRecordCardList";
import type { DynamicRecordTableProps } from "./DynamicRecordTable";

const VIRTUALIZE_THRESHOLD = 25;

/**
 * Responsive record list: table on md+ screens, stacked cards on small screens.
 */
export function ResponsiveTable(props: DynamicRecordTableProps) {
  const [mobileSearch, setMobileSearch] = React.useState("");
  const {
    items,
    fields,
    loading,
    page,
    limit,
    total,
    onPageChange,
    recordDetailPath = "/record",
  } = props;

  const filteredForMobile = React.useMemo(() => {
    if (!mobileSearch.trim()) return items;
    const q = mobileSearch.toLowerCase();
    return items.filter((item) =>
      Object.values(item.values).some(
        (v) => v != null && String(v).toLowerCase().includes(q)
      )
    );
  }, [items, mobileSearch]);

  return (
    <>
      {/* Desktop: full table */}
      <div className="hidden md:block">
        <DynamicRecordTable {...props} />
      </div>

      {/* Mobile: cards + search + pagination */}
      <Card className="md:hidden">
        <CardContent className="p-0">
          <div className="p-3 border-b bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="p-3 min-h-[200px]">
            {loading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
            ) : filteredForMobile.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No records.</p>
            ) : filteredForMobile.length > VIRTUALIZE_THRESHOLD ? (
              <VirtualizedRecordCardList
                items={filteredForMobile}
                fields={fields}
                recordDetailPath={recordDetailPath}
              />
            ) : (
              <div className="space-y-3">
                {filteredForMobile.map((record) => (
                  <MobileRecordCard
                    key={record.id}
                    record={record}
                    fields={fields}
                    recordDetailPath={recordDetailPath}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 p-3 border-t">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs px-1">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / limit) || loading}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
