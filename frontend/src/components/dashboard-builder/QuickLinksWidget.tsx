"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WidgetConfig } from "./types";
import { ExternalLink } from "lucide-react";

export interface QuickLinksWidgetProps {
  config: WidgetConfig;
}

export function QuickLinksWidget({ config }: QuickLinksWidgetProps) {
  const links = config.links ?? [];
  const title = config.title ?? "Quick links";

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add links in widget config.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {links.map((link, i) => {
                const isExternal = link.url.startsWith("http");
                if (isExternal) {
                  return (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        {link.label}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </a>
                  );
                }
                return (
                  <Button key={i} variant="outline" size="sm" asChild>
                    <Link href={link.url}>{link.label}</Link>
                  </Button>
                );
              })}
            </div>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 pt-2">
              {links.map((link, i) => (
                <li key={i}>
                  {link.url.startsWith("http") ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.url} className="hover:underline">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
