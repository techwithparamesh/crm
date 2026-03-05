/** Form field definition for form builder and embed (fieldsJSON). */
export interface FormFieldConfig {
  fieldKey: string;
  type: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
}

/** Public form config returned to embed script (no sensitive data). */
export interface FormConfigPublic {
  formId: string;
  formName: string;
  fields: FormFieldConfig[];
  redirectUrl: string | null;
  successMessage: string | null;
  recaptchaEnabled: boolean;
  recaptchaSiteKey: string | null;
}

/** Options for createLeadFromPayload (used by lead-capture.service). */
export interface CreateLeadFromPayloadOptions {
  formId?: string;
  createdBy?: string | null;
  sourceIP?: string | null;
  userAgent?: string | null;
}
