/**
 * User-friendly descriptions for common module slugs (e.g. from Loan/Finance template).
 * Shown when the module has no description from the API so users understand what each module is for.
 */
export const MODULE_DESCRIPTION_BY_SLUG: Record<string, string> = {
  leads: "People who asked about a loan or showed interest. Add leads from calls, forms, or website.",
  applicants: "People who submitted a loan application. Convert leads to applicants or add manually.",
  loans: "Loan cases moving through stages. Track from application to disbursement.",
  documents: "Document checklist per application (ID, income, address). Track pending and verified.",
  approvals: "Approval decisions on loans. Who approved or rejected, and when.",
  disbursements: "Loan payouts. Record when approved loan amounts are paid out.",
  contacts: "Contact directory. People and companies you work with.",
  companies: "Accounts and companies. Organizations you sell to or partner with.",
  deals: "Sales opportunities. Track value, stage, and close date.",
  tasks: "Follow-up tasks. Assign and track due dates.",
  activities: "Calls, meetings, emails. Log activity linked to records.",
  notes: "Notes and comments. Attach to records.",
  patients: "Patient records. Used in healthcare templates.",
  appointments: "Scheduled visits. Book and track appointments.",
};

/** Get a one-line description for a module: use API description, else fallback by slug (lowercase). */
export function getModuleDescription(module: { description?: string | null; slug?: string }): string {
  if (module.description?.trim()) return module.description.trim();
  const slug = (module.slug ?? "").toLowerCase();
  return MODULE_DESCRIPTION_BY_SLUG[slug] ?? `Records for ${module.slug ?? "this module"}. Add your first to get started.`;
}

/** Group slugs for "Loan journey" (main flow) vs "Process" (supporting). Used to group modules on the Modules page. */
export const LOAN_JOURNEY_SLUGS = ["leads", "applicants", "loans"];
export const LOAN_PROCESS_SLUGS = ["documents", "approvals", "disbursements"];

export function getModuleGroup(slug: string): "journey" | "process" | null {
  const s = slug.toLowerCase();
  if (LOAN_JOURNEY_SLUGS.includes(s)) return "journey";
  if (LOAN_PROCESS_SLUGS.includes(s)) return "process";
  return null;
}
