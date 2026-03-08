"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus, Users, Briefcase, CheckSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { modulesApi } from "@/lib/api";
import type { ModuleWithCount } from "@/lib/api";

const iconBySlug: Record<string, React.ComponentType<{ className?: string }>> = {
  leads: UserPlus,
  contacts: Users,
  deals: Briefcase,
  tasks: CheckSquare,
};
function getIcon(slug: string) {
  const Icon = iconBySlug[slug] ?? FileText;
  return <Icon className="h-4 w-4" />;
}

export function QuickCreateMenu() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleWithCount[]>([]);

  useEffect(() => {
    modulesApi.list().then(setModules).catch(() => setModules([]));
  }, []);

  const handleModule = (moduleId: string) => {
    router.push(`/records/${moduleId}/new`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {modules.slice(0, 8).map((m) => (
          <DropdownMenuItem key={m.id} onSelect={() => handleModule(m.id)}>
            {getIcon(m.slug)}
            <span>{m.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => router.push("/tasks/new")}>
          <CheckSquare className="h-4 w-4" />
          <span>New Task</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
