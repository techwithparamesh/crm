"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { FormFieldConfig } from "@/lib/api";

export interface FormSettingsPanelProps {
  formName: string;
  redirectUrl: string;
  successMessage: string;
  isActive: boolean;
  recaptchaEnabled: boolean;
  autoAssignUserId: string;
  onFormNameChange: (v: string) => void;
  onRedirectUrlChange: (v: string) => void;
  onSuccessMessageChange: (v: string) => void;
  onIsActiveChange: (v: boolean) => void;
  onRecaptchaEnabledChange: (v: boolean) => void;
  onAutoAssignUserIdChange: (v: string) => void;
  /** Optional: list of users for auto-assign dropdown */
  users?: { id: string; name: string }[];
}

export function FormSettingsPanel({
  formName,
  redirectUrl,
  successMessage,
  isActive,
  recaptchaEnabled,
  autoAssignUserId,
  onFormNameChange,
  onRedirectUrlChange,
  onSuccessMessageChange,
  onIsActiveChange,
  onRecaptchaEnabledChange,
  onAutoAssignUserIdChange,
  users = [],
}: FormSettingsPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="formName">Form name</Label>
        <Input
          id="formName"
          value={formName}
          onChange={(e) => onFormNameChange(e.target.value)}
          placeholder="e.g. Contact us"
        />
      </div>
      <div>
        <Label htmlFor="redirectUrl">Redirect URL (after submit)</Label>
        <Input
          id="redirectUrl"
          type="url"
          value={redirectUrl}
          onChange={(e) => onRedirectUrlChange(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div>
        <Label htmlFor="successMessage">Success message</Label>
        <Textarea
          id="successMessage"
          value={successMessage}
          onChange={(e) => onSuccessMessageChange(e.target.value)}
          placeholder="Thank you! We'll be in touch."
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(c) => onIsActiveChange(!!c)}
        />
        <Label htmlFor="isActive">Form is active (visible in embed)</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="recaptcha"
          checked={recaptchaEnabled}
          onCheckedChange={(c) => onRecaptchaEnabledChange(!!c)}
        />
        <Label htmlFor="recaptcha">Enable reCAPTCHA (spam protection)</Label>
      </div>
      {users.length > 0 && (
        <div>
          <Label htmlFor="autoAssign">Auto-assign new leads to</Label>
          <select
            id="autoAssign"
            className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={autoAssignUserId}
            onChange={(e) => onAutoAssignUserIdChange(e.target.value)}
          >
            <option value="">None</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
