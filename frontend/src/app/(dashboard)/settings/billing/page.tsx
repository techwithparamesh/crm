"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  billingApi,
  type PlanItem,
  type SubscriptionResponse,
  type InvoiceItem,
  type BillingCycle,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null | undefined>(undefined);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      billingApi.getPlans(),
      billingApi.getSubscription(),
      billingApi.getInvoices(10),
    ])
      .then(([pList, subRes, invList]) => {
        setPlans(pList);
        const sub =
          subRes && "subscription" in subRes && subRes.subscription === null
            ? null
            : (subRes as SubscriptionResponse);
        setSubscription(sub ?? null);
        setInvoices(Array.isArray(invList) ? invList : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setActionLoading(planId);
    setError("");
    try {
      await billingApi.subscribe({ planId, billingCycle });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Subscribe failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async (planId: string) => {
    setActionLoading(planId);
    setError("");
    try {
      await billingApi.changePlan({ planId, billingCycle });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Change plan failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You will lose access after the current period.")) return;
    setActionLoading("cancel");
    setError("");
    try {
      await billingApi.cancel();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setActionLoading(null);
    }
  };

  const sub = subscription && "id" in subscription ? subscription : null;
  const isTrial = sub?.status === "trial";
  const isActive = sub?.status === "active";

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Button variant="ghost" asChild>
          <Link href="/settings">← Back</Link>
        </Button>
        <p className="text-muted-foreground">Loading billing…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/settings">← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold">Billing</h1>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sub ? (
            <p className="text-muted-foreground">No active subscription. Choose a plan below.</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-semibold">{sub.planName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{sub.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price per user</p>
                  <p className="font-medium">{formatCurrency(sub.pricePerUser)}/month</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active users</p>
                  <p className="font-medium">{sub.activeUserCount ?? sub.userCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly total</p>
                  <p className="font-medium">{formatCurrency(sub.monthlyTotal ?? 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next billing date</p>
                  <p className="font-medium">
                    {isTrial ? formatDate(sub.trialEndsAt) : formatDate(sub.nextBillingDate ?? sub.currentPeriodEnd)}
                  </p>
                </div>
              </div>
              {isActive && (
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={!!actionLoading}>
                  {actionLoading === "cancel" ? "Cancelling…" : "Cancel subscription"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Upgrade / Choose plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <p className="text-sm text-muted-foreground">
            Per-user pricing. Total = active users × price per user. Yearly billing gets 20% off.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              variant={billingCycle === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === "yearly" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly (20% off)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = sub?.planId === plan.id;
              const monthlyTotal = (sub?.activeUserCount ?? 0) * plan.pricePerUser;
              const yearlyTotal = Math.round(monthlyTotal * 12 * 0.8);
              return (
                <div
                  key={plan.id}
                  className="rounded-lg border p-4 flex flex-col"
                >
                  <p className="font-semibold">{plan.name}</p>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                  )}
                  <p className="mt-2">
                    <span className="text-2xl font-bold">{formatCurrency(plan.pricePerUser)}</span>
                    <span className="text-muted-foreground text-sm">/user/month</span>
                  </p>
                  {plan.limits && (
                    <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
                      <li>Up to {plan.limits.maxUsers} users</li>
                      <li>Up to {plan.limits.maxModules} modules</li>
                      <li>Up to {plan.limits.maxAutomations} automations</li>
                    </ul>
                  )}
                  <div className="mt-auto pt-4">
                    {isCurrent ? (
                      <p className="text-sm font-medium text-primary">Current plan</p>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          sub ? handleChangePlan(plan.id) : handleSubscribe(plan.id)
                        }
                        disabled={!!actionLoading}
                      >
                        {actionLoading === plan.id
                          ? "Processing…"
                          : sub
                            ? "Switch to this plan"
                            : "Subscribe"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <p className="text-sm text-muted-foreground">Recent billing history.</p>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {inv.subscription?.plan?.name ?? "Plan"} · {formatCurrency(inv.totalAmount)}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {inv.userCount} user{inv.userCount !== 1 ? "s" : ""} × {formatCurrency(inv.pricePerUser)}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {formatDate(inv.billingPeriodStart)} – {formatDate(inv.billingPeriodEnd)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
