import { z } from "zod";

export const updateTenantSettingsSchema = z.object({
  companyName: z.string().max(255).optional().nullable(),
  logoUrl: z.string().max(2048).optional().nullable(),
  faviconUrl: z.string().max(2048).optional().nullable(),
  primaryColor: z.string().max(64).optional().nullable(),
  secondaryColor: z.string().max(64).optional().nullable(),
  customDomain: z.string().max(253).optional().nullable(),
});

export const uploadImageSchema = z.object({
  type: z.enum(["logo", "favicon"]),
  data: z.string().min(1), // base64
});

export type UpdateTenantSettingsInput = z.infer<typeof updateTenantSettingsSchema>;
