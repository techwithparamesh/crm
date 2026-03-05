import { z } from "zod";

export const subscribeSchema = z.object({
  planId: z.string().cuid(),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export const changePlanSchema = z.object({
  planId: z.string().cuid(),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;
