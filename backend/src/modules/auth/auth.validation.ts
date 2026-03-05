import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  tenantName: z.string().min(1, "Tenant name required"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required"),
  tenantId: z.string().min(1, "Tenant required"), // for multi-tenant login, client sends tenantId
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
