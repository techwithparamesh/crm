/**
 * Example CRM template definitions (Loan, Real Estate, Marketing Agency, Clinic).
 * Used by seed to populate CrmTemplate table.
 */

import type { CrmTemplateJSON } from "./templates.types.js";

export const LOAN_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    { name: "Applicants", slug: "applicants", icon: "user", description: "Loan applicants" },
    { name: "Loans", slug: "loans", icon: "credit-card", description: "Loan applications" },
    { name: "Contacts", slug: "contacts", icon: "users", description: "Contact directory" },
  ],
  fields: [
    { moduleSlug: "applicants", label: "Full Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "applicants", label: "Email", fieldKey: "email", fieldType: "email", orderIndex: 1 },
    { moduleSlug: "applicants", label: "Phone", fieldKey: "phone", fieldType: "phone", orderIndex: 2 },
    { moduleSlug: "applicants", label: "Loan Type", fieldKey: "loan_type", fieldType: "dropdown", optionsJSON: JSON.stringify(["Personal", "Home", "Auto", "Business"]), orderIndex: 3 },
    { moduleSlug: "loans", label: "Applicant", fieldKey: "applicant", fieldType: "text", orderIndex: 0 },
    { moduleSlug: "loans", label: "Amount", fieldKey: "amount", fieldType: "currency", orderIndex: 1 },
    { moduleSlug: "loans", label: "Status", fieldKey: "status", fieldType: "dropdown", optionsJSON: JSON.stringify(["Applied", "Under Review", "Approved", "Rejected", "Disbursed"]), orderIndex: 2 },
    { moduleSlug: "contacts", label: "Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "contacts", label: "Email", fieldKey: "email", fieldType: "email", orderIndex: 1 },
    { moduleSlug: "contacts", label: "Phone", fieldKey: "phone", fieldType: "phone", orderIndex: 2 },
  ],
  pipelines: [
    {
      moduleSlug: "loans",
      name: "Loan Pipeline",
      stages: [
        { stageName: "Application", orderIndex: 0 },
        { stageName: "Verification", orderIndex: 1 },
        { stageName: "Approval", orderIndex: 2 },
        { stageName: "Disbursed", orderIndex: 3 },
      ],
    },
  ],
  dashboards: [{ name: "Loan Overview", widgets: [{ widgetType: "metric", configJSON: "{}", orderIndex: 0 }] }],
  roles: [
    { name: "Loan Officer" },
    { name: "Underwriter" },
    { name: "Branch Manager" },
  ],
};

export const REAL_ESTATE_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    { name: "Leads", slug: "leads", icon: "user-plus", description: "Property inquiries" },
    { name: "Deals", slug: "deals", icon: "briefcase", description: "Property deals" },
    { name: "Contacts", slug: "contacts", icon: "users", description: "Buyers & sellers" },
    { name: "Properties", slug: "properties", icon: "home", description: "Property listings" },
  ],
  fields: [
    { moduleSlug: "leads", label: "Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "leads", label: "Email", fieldKey: "email", fieldType: "email", orderIndex: 1 },
    { moduleSlug: "leads", label: "Phone", fieldKey: "phone", fieldType: "phone", orderIndex: 2 },
    { moduleSlug: "leads", label: "Property Interest", fieldKey: "property_interest", fieldType: "text", orderIndex: 3 },
    { moduleSlug: "deals", label: "Deal Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "deals", label: "Value", fieldKey: "value", fieldType: "currency", orderIndex: 1 },
    { moduleSlug: "deals", label: "Property", fieldKey: "property", fieldType: "text", orderIndex: 2 },
    { moduleSlug: "contacts", label: "Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "contacts", label: "Email", fieldKey: "email", fieldType: "email", orderIndex: 1 },
    { moduleSlug: "contacts", label: "Phone", fieldKey: "phone", fieldType: "phone", orderIndex: 2 },
    { moduleSlug: "properties", label: "Address", fieldKey: "address", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "properties", label: "Price", fieldKey: "price", fieldType: "currency", orderIndex: 1 },
    { moduleSlug: "properties", label: "Status", fieldKey: "status", fieldType: "dropdown", optionsJSON: JSON.stringify(["Available", "Under Offer", "Sold"]), orderIndex: 2 },
  ],
  pipelines: [
    {
      moduleSlug: "deals",
      name: "Sales Pipeline",
      stages: [
        { stageName: "Lead", orderIndex: 0 },
        { stageName: "Qualified", orderIndex: 1 },
        { stageName: "Proposal", orderIndex: 2 },
        { stageName: "Negotiation", orderIndex: 3 },
        { stageName: "Closed Won", orderIndex: 4 },
        { stageName: "Closed Lost", orderIndex: 5 },
      ],
    },
  ],
  dashboards: [{ name: "Sales Overview", widgets: [{ widgetType: "metric", configJSON: "{}", orderIndex: 0 }] }],
  roles: [{ name: "Agent" }, { name: "Broker" }, { name: "Manager" }],
};

export const MARKETING_AGENCY_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    { name: "Leads", slug: "leads", icon: "user-plus", description: "Incoming leads" },
    { name: "Deals", slug: "deals", icon: "briefcase", description: "Opportunities" },
    { name: "Contacts", slug: "contacts", icon: "users", description: "Client contacts" },
    { name: "Campaigns", slug: "campaigns", icon: "megaphone", description: "Marketing campaigns" },
  ],
  fields: [
    { moduleSlug: "leads", label: "Company", fieldKey: "company", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "leads", label: "Contact Name", fieldKey: "name", fieldType: "text", orderIndex: 1 },
    { moduleSlug: "leads", label: "Email", fieldKey: "email", fieldType: "email", orderIndex: 2 },
    { moduleSlug: "leads", label: "Service Interest", fieldKey: "service_interest", fieldType: "dropdown", optionsJSON: JSON.stringify(["SEO", "PPC", "Social", "Content", "Full Service"]), orderIndex: 3 },
    { moduleSlug: "deals", label: "Deal Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "deals", label: "Value", fieldKey: "value", fieldType: "currency", orderIndex: 1 },
    { moduleSlug: "deals", label: "Client", fieldKey: "client", fieldType: "text", orderIndex: 2 },
    { moduleSlug: "contacts", label: "Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "contacts", label: "Email", fieldKey: "email", fieldType: "email", orderIndex: 1 },
    { moduleSlug: "contacts", label: "Company", fieldKey: "company", fieldType: "text", orderIndex: 2 },
    { moduleSlug: "campaigns", label: "Campaign Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "campaigns", label: "Channel", fieldKey: "channel", fieldType: "dropdown", optionsJSON: JSON.stringify(["Google", "Facebook", "LinkedIn", "Email", "Other"]), orderIndex: 1 },
    { moduleSlug: "campaigns", label: "Status", fieldKey: "status", fieldType: "dropdown", optionsJSON: JSON.stringify(["Draft", "Active", "Paused", "Completed"]), orderIndex: 2 },
  ],
  pipelines: [
    {
      moduleSlug: "deals",
      name: "Agency Pipeline",
      stages: [
        { stageName: "New", orderIndex: 0 },
        { stageName: "Contacted", orderIndex: 1 },
        { stageName: "Proposal Sent", orderIndex: 2 },
        { stageName: "Negotiation", orderIndex: 3 },
        { stageName: "Won", orderIndex: 4 },
        { stageName: "Lost", orderIndex: 5 },
      ],
    },
  ],
  dashboards: [{ name: "Agency Dashboard", widgets: [{ widgetType: "metric", configJSON: "{}", orderIndex: 0 }] }],
  roles: [{ name: "Account Manager" }, { name: "Sales" }, { name: "Director" }],
};

export const CLINIC_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    { name: "Patients", slug: "patients", icon: "user", description: "Patient records" },
    { name: "Appointments", slug: "appointments", icon: "calendar", description: "Appointment scheduling" },
    { name: "Contacts", slug: "contacts", icon: "users", description: "Emergency contacts" },
  ],
  fields: [
    { moduleSlug: "patients", label: "Patient Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "patients", label: "Email", fieldKey: "email", fieldType: "email", orderIndex: 1 },
    { moduleSlug: "patients", label: "Phone", fieldKey: "phone", fieldType: "phone", orderIndex: 2 },
    { moduleSlug: "patients", label: "Date of Birth", fieldKey: "dob", fieldType: "date", orderIndex: 3 },
    { moduleSlug: "patients", label: "Notes", fieldKey: "notes", fieldType: "textarea", orderIndex: 4 },
    { moduleSlug: "appointments", label: "Patient", fieldKey: "patient", fieldType: "text", orderIndex: 0 },
    { moduleSlug: "appointments", label: "Date", fieldKey: "date", fieldType: "date", orderIndex: 1 },
    { moduleSlug: "appointments", label: "Status", fieldKey: "status", fieldType: "dropdown", optionsJSON: JSON.stringify(["Scheduled", "Confirmed", "Completed", "Cancelled", "No-show"]), orderIndex: 2 },
    { moduleSlug: "contacts", label: "Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "contacts", label: "Phone", fieldKey: "phone", fieldType: "phone", orderIndex: 1 },
    { moduleSlug: "contacts", label: "Relation", fieldKey: "relation", fieldType: "text", orderIndex: 2 },
  ],
  pipelines: [
    {
      moduleSlug: "appointments",
      name: "Appointment Pipeline",
      stages: [
        { stageName: "Scheduled", orderIndex: 0 },
        { stageName: "Confirmed", orderIndex: 1 },
        { stageName: "Completed", orderIndex: 2 },
        { stageName: "Cancelled", orderIndex: 3 },
      ],
    },
  ],
  dashboards: [{ name: "Clinic Overview", widgets: [{ widgetType: "metric", configJSON: "{}", orderIndex: 0 }] }],
  roles: [{ name: "Receptionist" }, { name: "Doctor" }, { name: "Clinic Admin" }],
};

export const TEMPLATES = [
  { name: "Loan CRM", description: "Manage loan applicants and applications", icon: "credit-card", json: LOAN_CRM_TEMPLATE },
  { name: "Real Estate CRM", description: "Leads, deals, properties and contacts", icon: "home", json: REAL_ESTATE_CRM_TEMPLATE },
  { name: "Marketing Agency CRM", description: "Leads, deals, campaigns for agencies", icon: "megaphone", json: MARKETING_AGENCY_CRM_TEMPLATE },
  { name: "Clinic CRM", description: "Patients, appointments and contacts", icon: "heart-pulse", json: CLINIC_CRM_TEMPLATE },
];
