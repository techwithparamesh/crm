/**
 * Per-user SaaS billing: price = userCount × pricePerUser.
 * Yearly = 20% discount. Trial = 14 days for new tenants.
 */

import { prisma } from "../../prisma/client.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";

const TRIAL_DAYS = 14;
const YEARLY_DISCOUNT_PERCENT = 20;

export type BillingCycle = "monthly" | "yearly";

/**
 * Total subscription price: userCount × pricePerUser.
 * Yearly: apply 20% discount (price × 12 × 0.8).
 */
export function calculateSubscriptionPrice(
  userCount: number,
  pricePerUser: number,
  billingCycle: BillingCycle = "monthly"
): number {
  const monthlyTotal = userCount * pricePerUser;
  if (billingCycle === "yearly") {
    return Math.round(monthlyTotal * 12 * (1 - YEARLY_DISCOUNT_PERCENT / 100));
  }
  return monthlyTotal;
}

/** Monthly amount for display (before yearly discount). */
export function getMonthlyTotal(userCount: number, pricePerUser: number): number {
  return userCount * pricePerUser;
}

export async function getActiveUserCount(tenantId: string): Promise<number> {
  return prisma.user.count({
    where: mergeWhere(tenantId, { status: "active" }),
  });
}

/** First active plan (e.g. Starter) for new tenant trial. */
export async function getDefaultPlanId(): Promise<string | null> {
  const plan = await prisma.plan.findFirst({
    where: { isActive: true },
    orderBy: { pricePerUser: "asc" },
    select: { id: true },
  });
  return plan?.id ?? null;
}

export async function getPlans(): Promise<
  Array<{
    id: string;
    name: string;
    description: string | null;
    pricePerUser: number;
    billingCycle: string;
    isActive: boolean;
    limits: {
      maxUsers: number;
      maxModules: number;
      maxRecords: number;
      maxAutomations: number;
      maxApiCalls: number | null;
      maxStorageGB: number | null;
    } | null;
  }>
> {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    include: { limits: true },
    orderBy: { pricePerUser: "asc" },
  });
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    pricePerUser: p.pricePerUser,
    billingCycle: p.billingCycle,
    isActive: p.isActive,
    limits: p.limits
      ? {
          maxUsers: p.limits.maxUsers,
          maxModules: p.limits.maxModules,
          maxRecords: p.limits.maxRecords,
          maxAutomations: p.limits.maxAutomations,
          maxApiCalls: p.limits.maxApiCalls,
          maxStorageGB: p.limits.maxStorageGB,
        }
      : null,
  }));
}

/** Current subscription for tenant (latest trial or active). */
export async function getCurrentSubscription(tenantId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { tenantId, status: { in: ["trial", "active"] } },
    orderBy: { createdAt: "desc" },
    include: { plan: { include: { limits: true } } },
  });
  if (!sub) return null;
  const activeUsers = await getActiveUserCount(tenantId);
  const monthlyTotal = getMonthlyTotal(activeUsers, sub.pricePerUser);
  const nextBillingDate = sub.currentPeriodEnd ?? sub.trialEndsAt;
  return {
    id: sub.id,
    planId: sub.planId,
    planName: sub.plan.name,
    status: sub.status,
    billingCycle: sub.billingCycle,
    userCount: sub.userCount,
    activeUserCount: activeUsers,
    pricePerUser: sub.pricePerUser,
    monthlyTotal,
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
    trialEndsAt: sub.trialEndsAt,
    nextBillingDate,
    limits: sub.plan.limits,
  };
}

export async function getInvoices(tenantId: string, limit = 20) {
  return prisma.invoice.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { subscription: { include: { plan: true } } },
  });
}

/** Create trial subscription for new tenant (14 days). */
export async function createTrialSubscription(tenantId: string, planId: string): Promise<void> {
  const plan = await prisma.plan.findFirst({ where: { id: planId, isActive: true }, include: { limits: true } });
  if (!plan) throw new Error("Plan not found");
  const activeUsers = await getActiveUserCount(tenantId);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
  await prisma.subscription.create({
    data: {
      tenantId,
      planId: plan.id,
      status: "trial",
      billingCycle: plan.billingCycle,
      userCount: activeUsers,
      pricePerUser: plan.pricePerUser,
      trialEndsAt,
    },
  });
}

/** Subscribe: set subscription to active, set period dates. */
export async function subscribe(
  tenantId: string,
  planId: string,
  billingCycle: BillingCycle
): Promise<{ subscriptionId: string }> {
  const plan = await prisma.plan.findFirst({ where: { id: planId, isActive: true }, include: { limits: true } });
  if (!plan) throw new Error("Plan not found");
  const activeUsers = await getActiveUserCount(tenantId);
  const limits = await prisma.planLimit.findUnique({ where: { planId: plan.id } });
  if (limits && activeUsers > limits.maxUsers) throw new Error("User limit exceeded for this plan");
  const now = new Date();
  let periodEnd = new Date(now);
  if (billingCycle === "monthly") periodEnd.setMonth(periodEnd.getMonth() + 1);
  else periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  const sub = await prisma.subscription.create({
    data: {
      tenantId,
      planId: plan.id,
      status: "active",
      billingCycle,
      userCount: activeUsers,
      pricePerUser: plan.pricePerUser,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan: plan.name.toLowerCase() },
  });
  return { subscriptionId: sub.id };
}

/** Change plan: end current period and create new subscription (or update). */
export async function changePlan(tenantId: string, planId: string, billingCycle: BillingCycle): Promise<void> {
  const current = await prisma.subscription.findFirst({
    where: { tenantId, status: { in: ["trial", "active"] } },
    orderBy: { createdAt: "desc" },
  });
  if (current) {
    await prisma.subscription.update({
      where: { id: current.id },
      data: { status: "cancelled" },
    });
  }
  await subscribe(tenantId, planId, billingCycle);
}

/** Cancel: set subscription status to cancelled. */
export async function cancelSubscription(tenantId: string): Promise<void> {
  const sub = await prisma.subscription.findFirst({
    where: { tenantId, status: { in: ["trial", "active"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!sub) throw new Error("No active subscription");
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "cancelled" },
  });
}

/** Sync subscription userCount from active users (call periodically or after user add/remove). */
export async function syncSubscriptionUserCount(tenantId: string): Promise<void> {
  const activeUsers = await getActiveUserCount(tenantId);
  const sub = await prisma.subscription.findFirst({
    where: { tenantId, status: { in: ["trial", "active"] } },
    orderBy: { createdAt: "desc" },
  });
  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { userCount: activeUsers },
    });
  }
}
