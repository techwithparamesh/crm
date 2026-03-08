"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { modulesApi, fieldsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ModuleWithFields, Field } from "@/lib/api";
import { ArrowLeft, Plus, List, Pencil, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD_TYPES = ["text", "number", "email", "phone", "textarea", "dropdown", "multi_select", "checkbox", "date", "currency", "file", "boolean", "relation", "user"];

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const [moduleData, setModuleData] = useState<ModuleWithFields | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    modulesApi.get(moduleId).then(setModuleData).catch(() => setModuleData(null)).finally(() => setLoading(false));
  }, [moduleId]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!moduleData) return <p className="text-destructive">Module not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/modules"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{moduleData.name}</h1>
          <p className="text-muted-foreground">{moduleData.slug}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href={`/records/${moduleId}`}>
            <List className="h-4 w-4 mr-2" />
            View records
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/records/${moduleId}/new`}>
            <Plus className="h-4 w-4 mr-2" />
            New record
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Fields</CardTitle>
          <p className="text-sm text-muted-foreground">Define the fields for this module. Records will use these for data.</p>
        </CardHeader>
        <CardContent>
          <FieldsList moduleId={moduleId} fields={moduleData.fields} onUpdate={() => modulesApi.get(moduleId).then(setModuleData)} />
        </CardContent>
      </Card>
    </div>
  );
}

function labelToKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^[^a-z]/, "") || "";
}

function optionsTextToJSON(text: string): string {
  const lines = text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(lines);
}

function optionsJSONToText(json: string | null): string {
  if (!json?.trim()) return "";
  try {
    const arr = JSON.parse(json) as unknown;
    return Array.isArray(arr) ? arr.map(String).join("\n") : "";
  } catch {
    return "";
  }
}

const OPTION_TYPES = ["dropdown", "multi_select"];

function DraggableFieldRow({
  field,
  onEdit,
  onDelete,
  children,
}: {
  field: Field;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: field.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: field.id });
  return (
    <tr
      ref={(el) => { setNodeRef(el); setDropRef(el); }}
      className={cn(
        "border-b transition-colors",
        isDragging && "opacity-50 bg-muted/50",
        isOver && "ring-1 ring-primary/30 bg-primary/5"
      )}
    >
      <td className="py-2 w-10 align-middle">
        <button
          type="button"
          className="p-1.5 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:bg-muted hover:text-foreground touch-none"
          aria-label="Drag to reorder"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      {children}
    </tr>
  );
}

function FieldsList({ moduleId, fields, onUpdate }: { moduleId: string; fields: Field[]; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [keySyncedFromLabel, setKeySyncedFromLabel] = useState(true);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [allModules, setAllModules] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [editForm, setEditForm] = useState({ label: "", fieldKey: "", fieldType: "text", isRequired: false, optionsText: "", relationModuleId: "" });
  const [newField, setNewField] = useState({ label: "", fieldKey: "", fieldType: "text" as string, isRequired: false, optionsText: "", relationModuleId: "" });

  useEffect(() => {
    modulesApi.list().then((list) => setAllModules(list)).catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!newField.label || !newField.fieldKey) return;
    try {
      const body: Parameters<typeof fieldsApi.create>[1] = {
        label: newField.label,
        fieldKey: newField.fieldKey,
        fieldType: newField.fieldType,
        isRequired: newField.isRequired,
      };
      if (OPTION_TYPES.includes(newField.fieldType) && newField.optionsText.trim()) {
        body.optionsJSON = optionsTextToJSON(newField.optionsText);
      }
      if (newField.fieldType === "relation" && newField.relationModuleId) {
        body.relationModuleId = newField.relationModuleId;
      }
      body.orderIndex = fields.length;
      await fieldsApi.create(moduleId, body);
      setNewField({ label: "", fieldKey: "", fieldType: "text", isRequired: false, optionsText: "", relationModuleId: "" });
      setKeySyncedFromLabel(true);
      setAdding(false);
      onUpdate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const openEdit = (f: Field) => {
    setEditingField(f);
    setEditForm({
      label: f.label,
      fieldKey: f.fieldKey,
      fieldType: f.fieldType,
      isRequired: f.isRequired,
      optionsText: optionsJSONToText(f.optionsJSON ?? null),
      relationModuleId: f.relationModuleId ?? "",
    });
  };

  const handleEditSave = async () => {
    if (!editingField) return;
    if (!editForm.label.trim() || !editForm.fieldKey.trim()) return;
    try {
      const body: Parameters<typeof fieldsApi.update>[1] = {
        label: editForm.label.trim(),
        fieldKey: editForm.fieldKey.trim(),
        fieldType: editForm.fieldType,
        isRequired: editForm.isRequired,
      };
      if (OPTION_TYPES.includes(editForm.fieldType)) {
        body.optionsJSON = editForm.optionsText.trim() ? optionsTextToJSON(editForm.optionsText) : undefined;
      }
      await fieldsApi.update(editingField.id, body);
      setEditingField(null);
      onUpdate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update field");
    }
  };

  const handleDelete = async (field: Field) => {
    if (!confirm(`Delete the field "${field.label}"? This cannot be undone.`)) return;
    try {
      await fieldsApi.delete(field.id);
      onUpdate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete. The field may have been removed already—try refreshing the page.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = fields.findIndex((f) => f.id === active.id);
    const toIndex = fields.findIndex((f) => f.id === over.id);
    if (fromIndex < 0 || toIndex < 0) return;
    const newOrder = [...fields];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setReordering(true);
    try {
      await Promise.all(
        newOrder.map((f, i) => fieldsApi.update(f.id, { orderIndex: i }))
      );
      onUpdate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to reorder");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Drag the handle to reorder fields. Order here is used on record forms.</p>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 w-10"></th>
              <th className="pb-2">Label</th>
              <th className="pb-2">Key</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Required</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <DraggableFieldRow key={f.id} field={f} onEdit={() => openEdit(f)} onDelete={() => handleDelete(f)}>
                <td className="py-2">{f.label}</td>
                <td className="py-2 font-mono text-muted-foreground">{f.fieldKey}</td>
                <td className="py-2">{f.fieldType}</td>
                <td className="py-2">{f.isRequired ? "Yes" : "No"}</td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(f)} title="Edit field">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(f)} title="Delete field">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </DraggableFieldRow>
            ))}
          </tbody>
        </table>
      </DndContext>

      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit field</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={editForm.label}
                onChange={(e) => setEditForm((s) => ({ ...s, label: e.target.value }))}
                placeholder="e.g. Email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-key">Key</Label>
              <Input
                id="edit-key"
                value={editForm.fieldKey}
                onChange={(e) => setEditForm((s) => ({ ...s, fieldKey: e.target.value }))}
                placeholder="e.g. email"
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Type</Label>
              <select
                id="edit-type"
                value={editForm.fieldType}
                onChange={(e) => setEditForm((s) => ({ ...s, fieldType: e.target.value }))}
                className="h-10 rounded-md border border-input bg-background px-3 w-full"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {OPTION_TYPES.includes(editForm.fieldType) && (
              <div className="grid gap-2">
                <Label htmlFor="edit-options">Options (one per line)</Label>
                <textarea
                  id="edit-options"
                  value={editForm.optionsText}
                  onChange={(e) => setEditForm((s) => ({ ...s, optionsText: e.target.value }))}
                  placeholder={"Salary\nBusiness\nRental"}
                  rows={4}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full font-mono"
                />
                <p className="text-xs text-muted-foreground">Each line becomes one dropdown option.</p>
              </div>
            )}
            {editForm.fieldType === "relation" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-relation-module">Related module</Label>
                <select
                  id="edit-relation-module"
                  value={editForm.relationModuleId}
                  onChange={(e) => setEditForm((s) => ({ ...s, relationModuleId: e.target.value }))}
                  className="h-10 rounded-md border border-input bg-background px-3 w-full"
                >
                  <option value="">Select module...</option>
                  {allModules.filter((m) => m.id !== moduleId).map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.slug})</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Records will link to one record from this module.</p>
              </div>
            )}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.isRequired}
                onChange={(e) => setEditForm((s) => ({ ...s, isRequired: e.target.checked }))}
              />
              <span className="text-sm">Required</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {adding ? (
        <div className="flex flex-wrap gap-2 items-end p-4 border rounded-lg bg-muted/30">
          <input
            placeholder="Label"
            value={newField.label}
            onChange={(e) => {
              const label = e.target.value;
              setNewField((s) => ({
                ...s,
                label,
                fieldKey: keySyncedFromLabel ? labelToKey(label) : s.fieldKey,
              }));
            }}
            className="h-10 rounded-md border px-3 w-40"
          />
          <input
            placeholder="Key (e.g. contact_number)"
            value={newField.fieldKey}
            onChange={(e) => {
              setKeySyncedFromLabel(false);
              setNewField((s) => ({ ...s, fieldKey: e.target.value }));
            }}
            className="h-10 rounded-md border px-3 w-40 font-mono"
          />
          <select
            value={newField.fieldType}
            onChange={(e) => setNewField((s) => ({ ...s, fieldType: e.target.value }))}
            className="h-10 rounded-md border px-3"
          >
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {OPTION_TYPES.includes(newField.fieldType) && (
            <div className="w-full flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Options (one per line)</label>
              <textarea
                placeholder={"Salary\nBusiness\nRental"}
                value={newField.optionsText}
                onChange={(e) => setNewField((s) => ({ ...s, optionsText: e.target.value }))}
                rows={3}
                className="rounded-md border px-3 py-2 text-sm w-full min-w-[200px] font-mono"
              />
            </div>
          )}
          {newField.fieldType === "relation" && (
            <div className="w-full flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Related module</label>
              <select
                value={newField.relationModuleId}
                onChange={(e) => setNewField((s) => ({ ...s, relationModuleId: e.target.value }))}
                className="h-10 rounded-md border border-input bg-background px-3 min-w-[200px]"
              >
                <option value="">Select module...</option>
                {allModules.filter((m) => m.id !== moduleId).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.slug})</option>
                ))}
              </select>
            </div>
          )}
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={newField.isRequired} onChange={(e) => setNewField((s) => ({ ...s, isRequired: e.target.checked }))} />
            Required
          </label>
          <Button size="sm" onClick={handleAdd}>Add</Button>
          <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => { setAdding(true); setKeySyncedFromLabel(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add field
        </Button>
      )}
    </div>
  );
}
