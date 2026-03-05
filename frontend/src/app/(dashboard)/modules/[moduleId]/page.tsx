"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { modulesApi, fieldsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModuleWithFields, Field } from "@/lib/api";
import { ArrowLeft, Plus, List } from "lucide-react";

const FIELD_TYPES = ["text", "number", "email", "phone", "textarea", "dropdown", "multi_select", "checkbox", "date", "currency", "file", "boolean"];

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
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

function FieldsList({ moduleId, fields, onUpdate }: { moduleId: string; fields: Field[]; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false);
  const [newField, setNewField] = useState({ label: "", fieldKey: "", fieldType: "text" as string, isRequired: false });

  const handleAdd = async () => {
    if (!newField.label || !newField.fieldKey) return;
    try {
      await fieldsApi.create(moduleId, {
        label: newField.label,
        fieldKey: newField.fieldKey,
        fieldType: newField.fieldType,
        isRequired: newField.isRequired,
      });
      setNewField({ label: "", fieldKey: "", fieldType: "text", isRequired: false });
      setAdding(false);
      onUpdate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm("Delete this field?")) return;
    try {
      await fieldsApi.delete(fieldId);
      onUpdate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2">Label</th>
            <th className="pb-2">Key</th>
            <th className="pb-2">Type</th>
            <th className="pb-2">Required</th>
            <th className="pb-2 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.id} className="border-b">
              <td className="py-2">{f.label}</td>
              <td className="py-2 font-mono text-muted-foreground">{f.fieldKey}</td>
              <td className="py-2">{f.fieldType}</td>
              <td className="py-2">{f.isRequired ? "Yes" : "No"}</td>
              <td className="py-2">
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(f.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {adding ? (
        <div className="flex flex-wrap gap-2 items-end p-4 border rounded-lg bg-muted/30">
          <input
            placeholder="Label"
            value={newField.label}
            onChange={(e) => setNewField((s) => ({ ...s, label: e.target.value, fieldKey: s.fieldKey || e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
            className="h-10 rounded-md border px-3 w-40"
          />
          <input
            placeholder="fieldKey"
            value={newField.fieldKey}
            onChange={(e) => setNewField((s) => ({ ...s, fieldKey: e.target.value }))}
            className="h-10 rounded-md border px-3 w-40 font-mono"
          />
          <select
            value={newField.fieldType}
            onChange={(e) => setNewField((s) => ({ ...s, fieldType: e.target.value }))}
            className="h-10 rounded-md border px-3"
          >
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={newField.isRequired} onChange={(e) => setNewField((s) => ({ ...s, isRequired: e.target.checked }))} />
            Required
          </label>
          <Button size="sm" onClick={handleAdd}>Add</Button>
          <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add field
        </Button>
      )}
    </div>
  );
}
