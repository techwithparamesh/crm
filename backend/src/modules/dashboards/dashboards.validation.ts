import { z } from "zod";

export const createDashboardSchema = z.object({
  name: z.string().min(1),
});

export const createWidgetSchema = z.object({
  dashboardId: z.string().min(1),
  widgetType: z.string().min(1),
  configJSON: z.string().optional(),
  orderIndex: z.number().int().optional().default(0),
});

export const updateWidgetSchema = z.object({
  widgetType: z.string().optional(),
  configJSON: z.string().optional(),
  orderIndex: z.number().int().optional(),
});

export type CreateDashboardInput = z.infer<typeof createDashboardSchema>;
export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;
export type UpdateWidgetInput = z.infer<typeof updateWidgetSchema>;
