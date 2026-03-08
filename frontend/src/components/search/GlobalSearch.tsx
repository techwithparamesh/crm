"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchApi, type GlobalSearchResult, type RecordListItem } from "@/lib/api";

const DEBOUNCE_MS = 300;

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchApi.global(query, 8);
        setResults(data);
      } catch {
        setResults({});
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const slugs = results ? Object.keys(results) : [];
  const totalCount = results ? Object.values(results).reduce((s, arr) => s + arr.length, 0) : 0;

  const handleSelect = (recordId: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(`/record/${recordId}`);
  };

  const highlight = (values: Record<string, unknown>, query: string) => {
    const parts = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const str = Object.values(values).filter((v) => typeof v === "string").join(" ") || "";
    if (parts.length === 0) return str.slice(0, 80);
    for (const p of parts) {
      const i = str.toLowerCase().indexOf(p);
      if (i >= 0) return str.slice(Math.max(0, i - 20), i + 60);
    }
    return str.slice(0, 80);
  };

  return (
    <div className="relative w-full max-w-md" ref={panelRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search records..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-full border border-border bg-slate-100/80 dark:bg-muted/50 py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[28rem] overflow-auto rounded-xl border border-border bg-card shadow-lg">
          {!query.trim() && (
            <p className="p-4 text-sm text-muted-foreground">Type to search records across modules</p>
          )}
          {query.trim() && loading && (
            <p className="p-4 text-sm text-muted-foreground">Searching...</p>
          )}
          {query.trim() && !loading && results && totalCount === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No results found</p>
          )}
          {query.trim() && !loading && totalCount > 0 && (
            <ul className="py-2">
              {slugs.map((slug) => (
                <li key={slug}>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {slug}
                  </div>
                  {(results![slug] as RecordListItem[]).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/70 rounded-none"
                      onClick={() => handleSelect(item.id)}
                    >
                      <div className="truncate text-foreground">
                        {highlight(item.values, query) || item.id}
                      </div>
                    </button>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
