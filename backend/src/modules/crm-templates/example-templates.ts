/**
 * Example CRM template definitions (Loan, Real Estate, Marketing Agency, Clinic).
 * Used by seed to populate CrmTemplate table.
 */

import type { CrmTemplateJSON } from "./templates.types.js";

/** Spec-format template: modules[].fields inline, pipelines[].stageNames as string[] */
export const SPEC_LOAN_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Leads",
      slug: "leads",
      icon: "user-plus",
      description: "Incoming leads",
      fields: [
        { label: "Full Name", type: "text", required: true },
        { label: "Phone", type: "phone" },
        { label: "Email", type: "email" },
        { label: "Lead Status", type: "select", options: ["New", "Contacted", "Qualified", "Lost"] },
      ],
    },
    {
      name: "Applicants",
      slug: "applicants",
      icon: "user",
      description: "Loan applicants",
      fields: [
        { label: "Name", type: "text" },
        { label: "Phone", type: "phone" },
        { label: "PAN", type: "text" },
        { label: "Aadhaar", type: "text" },
        { label: "Loan Amount", type: "currency" },
        { label: "Loan Type", type: "select", options: ["Personal", "Home", "Car", "Business"] },
      ],
    },
    {
      name: "Loans",
      slug: "loans",
      icon: "credit-card",
      description: "Loan applications",
      fields: [
        { label: "Loan ID", type: "text" },
        { label: "Amount", type: "currency" },
        { label: "Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
      ],
    },
  ],
  pipelines: [
    {
      name: "Loan Processing",
      moduleSlug: "loans",
      stageNames: ["Lead", "Documents Pending", "Verification", "Approved", "Disbursed"],
    },
  ],
  dashboards: [{ name: "Loan Overview", widgets: [{ widgetType: "metric_card", configJSON: "{}", orderIndex: 0 }] }],
  roles: [{ name: "Loan Officer" }, { name: "Underwriter" }, { name: "Branch Manager" }],
};

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
  dashboards: [{ name: "Loan Overview", widgets: [{ widgetType: "metric_card", configJSON: "{}", orderIndex: 0 }] }],
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
  dashboards: [{ name: "Sales Overview", widgets: [{ widgetType: "metric_card", configJSON: "{}", orderIndex: 0 }] }],
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
  dashboards: [{ name: "Agency Dashboard", widgets: [{ widgetType: "metric_card", configJSON: "{}", orderIndex: 0 }] }],
  roles: [{ name: "Account Manager" }, { name: "Sales" }, { name: "Director" }],
};

/** Healthcare template: spec format with inline fields, views, roleDashboards */
export const HEALTHCARE_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Patients",
      slug: "patients",
      icon: "user",
      description: "Patient records",
      fields: [
        { label: "Patient Name", type: "text", required: true },
        { label: "Phone", type: "phone" },
        { label: "DOB", type: "date" },
        { label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
      ],
    },
    {
      name: "Appointments",
      slug: "appointments",
      icon: "calendar",
      description: "Appointment scheduling",
      fields: [
        { label: "Patient", type: "text" },
        { label: "Doctor", type: "text" },
        { label: "Visit Date", type: "date" },
        { label: "Status", type: "select", options: ["Scheduled", "Checked In", "Consultation", "Completed", "Cancelled"] },
      ],
    },
  ],
  pipelines: [
    {
      name: "Appointment Pipeline",
      module: "appointments",
      stageNames: ["Scheduled", "Checked In", "Consultation", "Completed"],
    },
  ],
  dashboards: [
    { name: "Clinic Dashboard", widgets: [{ widgetType: "metric_card", configJSON: "{}", orderIndex: 0 }] },
  ],
  views: [
    { moduleSlug: "patients", name: "All Patients", viewType: "table", orderIndex: 0 },
    { moduleSlug: "appointments", name: "All Appointments", viewType: "table", orderIndex: 0 },
    { moduleSlug: "appointments", name: "By Stage", viewType: "kanban", orderIndex: 1 },
  ],
  roles: [
    { name: "Receptionist" },
    { name: "Doctor" },
    { name: "Clinic Admin" },
  ],
  roleDashboards: [
    { roleName: "Clinic Admin", dashboardName: "Clinic Dashboard", orderIndex: 0 },
    { roleName: "Doctor", dashboardName: "Clinic Dashboard", orderIndex: 0 },
    { roleName: "Receptionist", dashboardName: "Clinic Dashboard", orderIndex: 0 },
  ],
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
  dashboards: [{ name: "Clinic Overview", widgets: [{ widgetType: "metric_card", configJSON: "{}", orderIndex: 0 }] }],
  roles: [{ name: "Receptionist" }, { name: "Doctor" }, { name: "Clinic Admin" }],
};

export const SCHOOL_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    { name: "Students", slug: "students", icon: "graduation-cap", description: "Student records" },
    { name: "Classes", slug: "classes", icon: "book-open", description: "Classes and sections" },
    { name: "Enrollments", slug: "enrollments", icon: "clipboard-list", description: "Student enrollments" },
    { name: "Guardians", slug: "guardians", icon: "users", description: "Parents and guardians" },
  ],
  fields: [
    { moduleSlug: "students", label: "Student Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "students", label: "Date of Birth", fieldKey: "dob", fieldType: "date", orderIndex: 1 },
    { moduleSlug: "students", label: "Grade", fieldKey: "grade", fieldType: "dropdown", optionsJSON: JSON.stringify(["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]), orderIndex: 2 },
    { moduleSlug: "students", label: "Guardian", fieldKey: "guardian", fieldType: "text", orderIndex: 3 },
    { moduleSlug: "students", label: "Status", fieldKey: "status", fieldType: "dropdown", optionsJSON: JSON.stringify(["Active", "Inactive", "Graduated", "Transferred"]), orderIndex: 4 },
    { moduleSlug: "classes", label: "Class Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "classes", label: "Subject", fieldKey: "subject", fieldType: "text", orderIndex: 1 },
    { moduleSlug: "classes", label: "Grade Level", fieldKey: "grade_level", fieldType: "text", orderIndex: 2 },
    { moduleSlug: "classes", label: "Capacity", fieldKey: "capacity", fieldType: "number", orderIndex: 3 },
    { moduleSlug: "enrollments", label: "Student", fieldKey: "student", fieldType: "text", orderIndex: 0 },
    { moduleSlug: "enrollments", label: "Class", fieldKey: "class", fieldType: "text", orderIndex: 1 },
    { moduleSlug: "enrollments", label: "Academic Year", fieldKey: "academic_year", fieldType: "text", orderIndex: 2 },
    { moduleSlug: "enrollments", label: "Status", fieldKey: "status", fieldType: "dropdown", optionsJSON: JSON.stringify(["Enrolled", "Completed", "Dropped", "Waitlist"]), orderIndex: 3 },
    { moduleSlug: "guardians", label: "Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "guardians", label: "Email", fieldKey: "email", fieldType: "email", orderIndex: 1 },
    { moduleSlug: "guardians", label: "Phone", fieldKey: "phone", fieldType: "phone", orderIndex: 2 },
    { moduleSlug: "guardians", label: "Relation", fieldKey: "relation", fieldType: "dropdown", optionsJSON: JSON.stringify(["Parent", "Guardian", "Other"]), orderIndex: 3 },
  ],
  pipelines: [
    {
      moduleSlug: "enrollments",
      name: "Enrollment Pipeline",
      stages: [
        { stageName: "Application", orderIndex: 0 },
        { stageName: "Review", orderIndex: 1 },
        { stageName: "Enrolled", orderIndex: 2 },
        { stageName: "Completed", orderIndex: 3 },
      ],
    },
  ],
  dashboards: [{ name: "School Overview", widgets: [{ widgetType: "metric_card", configJSON: "{}", orderIndex: 0 }] }],
  roles: [{ name: "Teacher" }, { name: "Admin" }, { name: "Registrar" }],
};

export const APARTMENT_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    { name: "Properties", slug: "properties", icon: "building", description: "Buildings and complexes" },
    { name: "Units", slug: "units", icon: "door-open", description: "Rental units" },
    { name: "Tenants", slug: "tenants", icon: "users", description: "Renters and leaseholders" },
    { name: "Leases", slug: "leases", icon: "file-signature", description: "Lease agreements" },
    { name: "Maintenance", slug: "maintenance", icon: "wrench", description: "Maintenance requests" },
  ],
  fields: [
    { moduleSlug: "properties", label: "Property Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "properties", label: "Address", fieldKey: "address", fieldType: "text", orderIndex: 1 },
    { moduleSlug: "properties", label: "Units Count", fieldKey: "units_count", fieldType: "number", orderIndex: 2 },
    { moduleSlug: "properties", label: "Status", fieldKey: "status", fieldType: "dropdown", optionsJSON: JSON.stringify(["Active", "Under Renovation", "Sold"]), orderIndex: 3 },
    { moduleSlug: "units", label: "Unit Number", fieldKey: "unit_number", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "units", label: "Property", fieldKey: "property", fieldType: "text", orderIndex: 1 },
    { moduleSlug: "units", label: "Bedrooms", fieldKey: "bedrooms", fieldType: "number", orderIndex: 2 },
    { moduleSlug: "units", label: "Rent", fieldKey: "rent", fieldType: "currency", orderIndex: 3 },
    { moduleSlug: "units", label: "Status", fieldKey: "status", fieldType: "dropdown", optionsJSON: JSON.stringify(["Available", "Occupied", "Reserved", "Under Maintenance"]), orderIndex: 4 },
    { moduleSlug: "tenants", label: "Name", fieldKey: "name", fieldType: "text", isRequired: true, orderIndex: 0 },
    { moduleSlug: "tenants", label: "Email", fieldKey: "email", fieldType: "email", orderIndex: 1 },
    { moduleSlug: "tenants", label: "Phone", fieldKey: "phone", fieldType: "phone", orderIndex: 2 },
    { moduleSlug: "tenants", label: "Unit", fieldKey: "unit", fieldType: "text", orderIndex: 3 },
    { moduleSlug: "leases", label: "Tenant", fieldKey: "tenant", fieldType: "text", orderIndex: 0 },
    { moduleSlug: "leases", label: "Unit", fieldKey: "unit", fieldType: "text", orderIndex: 1 },
    { moduleSlug: "leases", label: "Start Date", fieldKey: "start_date", fieldType: "date", orderIndex: 2 },
    { moduleSlug: "leases", label: "End Date", fieldKey: "end_date", fieldType: "date", orderIndex: 3 },
    { moduleSlug: "leases", label: "Rent Amount", fieldKey: "rent_amount", fieldType: "currency", orderIndex: 4 },
    { moduleSlug: "leases", label: "Status", fieldKey: "status", fieldType: "dropdown", optionsJSON: JSON.stringify(["Draft", "Active", "Expired", "Terminated"]), orderIndex: 5 },
    { moduleSlug: "maintenance", label: "Unit", fieldKey: "unit", fieldType: "text", orderIndex: 0 },
    { moduleSlug: "maintenance", label: "Description", fieldKey: "description", fieldType: "textarea", orderIndex: 1 },
    { moduleSlug: "maintenance", label: "Priority", fieldKey: "priority", fieldType: "dropdown", optionsJSON: JSON.stringify(["Low", "Medium", "High", "Urgent"]), orderIndex: 2 },
    { moduleSlug: "maintenance", label: "Status", fieldKey: "status", fieldType: "dropdown", optionsJSON: JSON.stringify(["Submitted", "Assigned", "In Progress", "Completed", "Cancelled"]), orderIndex: 3 },
  ],
  pipelines: [
    {
      moduleSlug: "leases",
      name: "Lease Pipeline",
      stages: [
        { stageName: "Application", orderIndex: 0 },
        { stageName: "Approved", orderIndex: 1 },
        { stageName: "Active", orderIndex: 2 },
        { stageName: "Expired", orderIndex: 3 },
      ],
    },
    {
      moduleSlug: "maintenance",
      name: "Maintenance Pipeline",
      stages: [
        { stageName: "Submitted", orderIndex: 0 },
        { stageName: "Assigned", orderIndex: 1 },
        { stageName: "In Progress", orderIndex: 2 },
        { stageName: "Completed", orderIndex: 3 },
      ],
    },
  ],
  dashboards: [{ name: "Property Overview", widgets: [{ widgetType: "metric_card", configJSON: "{}", orderIndex: 0 }] }],
  roles: [{ name: "Property Manager" }, { name: "Leasing Agent" }, { name: "Maintenance" }],
};

export const TEMPLATES = [
  { name: "Loan CRM", category: "Finance", description: "Leads, applicants, loans and Loan Processing pipeline", icon: "credit-card", json: SPEC_LOAN_CRM_TEMPLATE },
  { name: "Real Estate CRM", category: "Real Estate", description: "Leads, deals, properties and contacts", icon: "home", json: REAL_ESTATE_CRM_TEMPLATE },
  { name: "Marketing Agency CRM", category: "Marketing", description: "Leads, deals, campaigns for agencies", icon: "megaphone", json: MARKETING_AGENCY_CRM_TEMPLATE },
  { name: "Healthcare CRM", category: "Healthcare", description: "Patients, appointments, clinic dashboard and role-based views", icon: "heart-pulse", json: HEALTHCARE_CRM_TEMPLATE },
  { name: "Clinic CRM", category: "Healthcare", description: "Patients, appointments and contacts (classic)", icon: "heart-pulse", json: CLINIC_CRM_TEMPLATE },
  { name: "School CRM", category: "Education", description: "Students, classes, enrollments and guardians", icon: "graduation-cap", json: SCHOOL_CRM_TEMPLATE },
  { name: "Apartment / Property CRM", category: "Real Estate", description: "Properties, units, tenants, leases and maintenance", icon: "building", json: APARTMENT_CRM_TEMPLATE },
];
