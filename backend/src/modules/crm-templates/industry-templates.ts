/**
 * Complete industry CRM templates for the Dynamic Multi-Tenant SaaS CRM Platform.
 * Each template includes: modules, fields, pipelines, dashboards, views, roles, default widgets.
 * Compatible with the existing template installer service.
 */

import type { CrmTemplateJSON } from "./templates.types.js";

function wMetric(title: string, orderIndex: number, extra?: Record<string, unknown>) {
  return {
    widgetType: "metric_card",
    configJSON: JSON.stringify({ title, metricType: "count", ...extra }),
    orderIndex,
  };
}

function wChart(type: "bar_chart" | "pie_chart" | "time_series", title: string, orderIndex: number) {
  return { widgetType: type, configJSON: JSON.stringify({ title }), orderIndex };
}

function wTable(title: string, orderIndex: number) {
  return { widgetType: "table", configJSON: JSON.stringify({ title }), orderIndex };
}

function wQuickLinks(actions: { label: string; url?: string }[], orderIndex: number) {
  return {
    widgetType: "quick_links",
    configJSON: JSON.stringify({ links: actions }),
    orderIndex,
  };
}

function defaultViews(moduleSlug: string) {
  return [
    { moduleSlug, name: "All Records", viewType: "table", orderIndex: 0 },
    { moduleSlug, name: "My Records", viewType: "table", orderIndex: 1 },
    { moduleSlug, name: "Recent Records", viewType: "table", orderIndex: 2 },
  ];
}

// ---------------------------------------------------------------------------
// 1. SALES CRM (Universal)
// ---------------------------------------------------------------------------
export const SALES_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Leads",
      slug: "leads",
      icon: "user-plus",
      description: "Incoming leads",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Email", type: "email" },
        { label: "Phone", type: "phone" },
        { label: "Source", type: "text" },
        { label: "Status", type: "select", options: ["New", "Contacted", "Qualified", "Lost"] },
      ],
    },
    {
      name: "Contacts",
      slug: "contacts",
      icon: "users",
      description: "Contact directory",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Email", type: "email" },
        { label: "Phone", type: "phone" },
        { label: "Company", type: "text" },
      ],
    },
    {
      name: "Companies",
      slug: "companies",
      icon: "building",
      description: "Accounts and companies",
      fields: [
        { label: "Company Name", type: "text", required: true },
        { label: "Industry", type: "text" },
        { label: "Phone", type: "phone" },
        { label: "Website", type: "text" },
      ],
    },
    {
      name: "Deals",
      slug: "deals",
      icon: "briefcase",
      description: "Sales opportunities",
      fields: [
        { label: "Deal Name", type: "text", required: true },
        { label: "Amount", type: "currency" },
        { label: "Stage", type: "text" },
        { label: "Close Date", type: "date" },
        { label: "Contact", type: "relation", relationModuleSlug: "contacts" },
        { label: "Owner", type: "user" },
      ],
    },
    {
      name: "Activities",
      slug: "activities",
      icon: "activity",
      description: "Calls, meetings, emails",
      fields: [
        { label: "Subject", type: "text" },
        { label: "Type", type: "select", options: ["Call", "Meeting", "Email"] },
        { label: "Date", type: "date" },
        { label: "Related To", type: "relation", relationModuleSlug: "contacts" },
      ],
    },
    {
      name: "Tasks",
      slug: "tasks",
      icon: "check-square",
      description: "Follow-up tasks",
      fields: [
        { label: "Title", type: "text", required: true },
        { label: "Due Date", type: "date" },
        { label: "Status", type: "select", options: ["Todo", "In Progress", "Done"] },
      ],
    },
    {
      name: "Notes",
      slug: "notes",
      icon: "file-text",
      description: "Notes and comments",
      fields: [
        { label: "Title", type: "text" },
        { label: "Body", type: "textarea" },
      ],
    },
  ],
  pipelines: [
    {
      name: "Sales Pipeline",
      module: "deals",
      stages: ["New", "Contacted", "Proposal", "Negotiation", "Closed Won", "Closed Lost"],
    },
  ],
  dashboards: [
    {
      name: "Sales Dashboard",
      widgets: [
        wMetric("Total leads", 0),
        wMetric("Deals value", 1, { metricType: "sum", valueField: "amount" }),
        wMetric("Conversion rate", 2),
        wChart("time_series", "Leads per day", 3),
      ],
    },
  ],
  views: [
    ...defaultViews("leads"),
    ...defaultViews("contacts"),
    ...defaultViews("companies"),
    ...defaultViews("deals"),
  ],
  roles: [
    { name: "Admin" },
    { name: "Sales Manager" },
    { name: "Sales Rep" },
  ],
  roleDashboards: [
    { roleName: "Admin", dashboardName: "Sales Dashboard", orderIndex: 0 },
    { roleName: "Sales Manager", dashboardName: "Sales Dashboard", orderIndex: 0 },
    { roleName: "Sales Rep", dashboardName: "Sales Dashboard", orderIndex: 0 },
  ],
};

// ---------------------------------------------------------------------------
// 2. LOAN / FINANCE CRM
// ---------------------------------------------------------------------------
export const LOAN_FINANCE_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Leads",
      slug: "leads",
      icon: "user-plus",
      description: "Loan inquiries",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Phone", type: "phone" },
        { label: "Email", type: "email" },
        { label: "Loan Type", type: "select", options: ["Personal", "Home", "Car", "Business"] },
      ],
    },
    {
      name: "Applicants",
      slug: "applicants",
      icon: "user",
      description: "Loan applicants",
      fields: [
        { label: "Applicant Name", type: "text", required: true },
        { label: "Phone", type: "phone" },
        { label: "PAN", type: "text" },
        { label: "Aadhaar", type: "text" },
        { label: "Loan Type", type: "select", options: ["Personal", "Home", "Car", "Business"] },
        { label: "Loan Amount", type: "currency" },
        { label: "Status", type: "select", options: ["Draft", "Submitted", "Under Review", "Approved", "Rejected"] },
      ],
    },
    {
      name: "Loans",
      slug: "loans",
      icon: "credit-card",
      description: "Loan applications",
      fields: [
        { label: "Loan ID", type: "text" },
        { label: "Applicant", type: "relation", relationModuleSlug: "applicants" },
        { label: "Amount", type: "currency" },
        { label: "Status", type: "text" },
      ],
    },
    {
      name: "Documents",
      slug: "documents",
      icon: "file",
      description: "Document checklist",
      fields: [
        { label: "Document Name", type: "text" },
        { label: "Applicant", type: "relation", relationModuleSlug: "applicants" },
        { label: "Type", type: "select", options: ["ID", "Income", "Address", "Other"] },
        { label: "Status", type: "select", options: ["Pending", "Received", "Verified"] },
      ],
    },
    {
      name: "Approvals",
      slug: "approvals",
      icon: "check-circle",
      description: "Approval workflow",
      fields: [
        { label: "Loan", type: "relation", relationModuleSlug: "loans" },
        { label: "Approved By", type: "user" },
        { label: "Date", type: "date" },
        { label: "Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
      ],
    },
    {
      name: "Disbursements",
      slug: "disbursements",
      icon: "send",
      description: "Disbursement tracking",
      fields: [
        { label: "Loan", type: "relation", relationModuleSlug: "loans" },
        { label: "Amount", type: "currency" },
        { label: "Date", type: "date" },
        { label: "Status", type: "select", options: ["Scheduled", "Completed", "Failed"] },
      ],
    },
  ],
  pipelines: [
    {
      name: "Loan Pipeline",
      module: "loans",
      stages: ["Lead", "Documents Pending", "Verification", "Approved", "Disbursed"],
    },
  ],
  dashboards: [
    {
      name: "Finance Dashboard",
      widgets: [
        wMetric("Applications this month", 0),
        wMetric("Loan approval rate", 1),
        wChart("bar_chart", "Disbursement chart", 2),
      ],
    },
  ],
  views: [
    ...defaultViews("leads"),
    ...defaultViews("applicants"),
    ...defaultViews("loans"),
  ],
  roles: [
    { name: "Admin" },
    { name: "Loan Officer" },
    { name: "Underwriter" },
    { name: "Branch Manager" },
  ],
  roleDashboards: [
    { roleName: "Admin", dashboardName: "Finance Dashboard", orderIndex: 0 },
    { roleName: "Branch Manager", dashboardName: "Finance Dashboard", orderIndex: 0 },
    { roleName: "Loan Officer", dashboardName: "Finance Dashboard", orderIndex: 0 },
    { roleName: "Underwriter", dashboardName: "Finance Dashboard", orderIndex: 0 },
  ],
};

// ---------------------------------------------------------------------------
// 3. HEALTHCARE CRM
// ---------------------------------------------------------------------------
export const HEALTHCARE_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Patients",
      slug: "patients",
      icon: "user",
      description: "Patient records",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Phone", type: "phone" },
        { label: "DOB", type: "date" },
        { label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
        { label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
      ],
    },
    {
      name: "Appointments",
      slug: "appointments",
      icon: "calendar",
      description: "Appointment scheduling",
      fields: [
        { label: "Patient", type: "relation", relationModuleSlug: "patients" },
        { label: "Doctor", type: "relation", relationModuleSlug: "doctors" },
        { label: "Visit Date", type: "date" },
        { label: "Status", type: "select", options: ["Scheduled", "Checked In", "Consultation", "Treatment", "Completed", "Cancelled"] },
      ],
    },
    {
      name: "Doctors",
      slug: "doctors",
      icon: "stethoscope",
      description: "Doctor directory",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Specialization", type: "text" },
        { label: "Phone", type: "phone" },
      ],
    },
    {
      name: "Treatments",
      slug: "treatments",
      icon: "heart-pulse",
      description: "Treatment records",
      fields: [
        { label: "Patient", type: "relation", relationModuleSlug: "patients" },
        { label: "Treatment Name", type: "text" },
        { label: "Date", type: "date" },
        { label: "Status", type: "select", options: ["Planned", "In Progress", "Completed"] },
      ],
    },
    {
      name: "Prescriptions",
      slug: "prescriptions",
      icon: "pill",
      description: "Prescriptions",
      fields: [
        { label: "Patient", type: "relation", relationModuleSlug: "patients" },
        { label: "Doctor", type: "relation", relationModuleSlug: "doctors" },
        { label: "Date", type: "date" },
        { label: "Medication", type: "textarea" },
      ],
    },
    {
      name: "Billing",
      slug: "billing",
      icon: "receipt",
      description: "Billing and invoices",
      fields: [
        { label: "Patient", type: "relation", relationModuleSlug: "patients" },
        { label: "Amount", type: "currency" },
        { label: "Status", type: "select", options: ["Draft", "Sent", "Paid", "Overdue"] },
      ],
    },
    {
      name: "Payments",
      slug: "payments",
      icon: "credit-card",
      description: "Payment records",
      fields: [
        { label: "Patient", type: "relation", relationModuleSlug: "patients" },
        { label: "Amount", type: "currency" },
        { label: "Date", type: "date" },
        { label: "Method", type: "select", options: ["Cash", "Card", "UPI", "Insurance"] },
      ],
    },
  ],
  pipelines: [
    {
      name: "Appointment Pipeline",
      module: "appointments",
      stages: ["Scheduled", "Checked In", "Consultation", "Treatment", "Completed"],
    },
  ],
  dashboards: [
    {
      name: "Clinic Dashboard",
      widgets: [
        wMetric("Appointments today", 0),
        wMetric("Patients this month", 1),
        wMetric("Revenue", 2, { metricType: "sum", valueField: "amount" }),
        wQuickLinks(
          [
            { label: "Add patient" },
            { label: "Book appointment" },
          ],
          3
        ),
      ],
    },
  ],
  views: [
    ...defaultViews("patients"),
    ...defaultViews("appointments"),
    ...defaultViews("doctors"),
  ],
  roles: [
    { name: "Admin" },
    { name: "Doctor" },
    { name: "Receptionist" },
    { name: "Clinic Admin" },
  ],
  roleDashboards: [
    { roleName: "Admin", dashboardName: "Clinic Dashboard", orderIndex: 0 },
    { roleName: "Clinic Admin", dashboardName: "Clinic Dashboard", orderIndex: 0 },
    { roleName: "Doctor", dashboardName: "Clinic Dashboard", orderIndex: 0 },
    { roleName: "Receptionist", dashboardName: "Clinic Dashboard", orderIndex: 0 },
  ],
};

// ---------------------------------------------------------------------------
// 4. REAL ESTATE CRM
// ---------------------------------------------------------------------------
export const REAL_ESTATE_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Leads",
      slug: "leads",
      icon: "user-plus",
      description: "Property inquiries",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Email", type: "email" },
        { label: "Phone", type: "phone" },
        { label: "Property Interest", type: "text" },
      ],
    },
    {
      name: "Properties",
      slug: "properties",
      icon: "home",
      description: "Property listings",
      fields: [
        { label: "Property Name", type: "text", required: true },
        { label: "Location", type: "text" },
        { label: "Price", type: "currency" },
        { label: "Status", type: "select", options: ["Available", "Under Offer", "Sold"] },
      ],
    },
    {
      name: "Site Visits",
      slug: "site_visits",
      icon: "map-pin",
      description: "Site visit scheduling",
      fields: [
        { label: "Customer", type: "relation", relationModuleSlug: "leads" },
        { label: "Property", type: "relation", relationModuleSlug: "properties" },
        { label: "Visit Date", type: "date" },
        { label: "Status", type: "select", options: ["Scheduled", "Completed", "Cancelled"] },
      ],
    },
    {
      name: "Deals",
      slug: "deals",
      icon: "briefcase",
      description: "Property deals",
      fields: [
        { label: "Deal Name", type: "text", required: true },
        { label: "Property", type: "relation", relationModuleSlug: "properties" },
        { label: "Customer", type: "relation", relationModuleSlug: "leads" },
        { label: "Value", type: "currency" },
      ],
    },
    {
      name: "Bookings",
      slug: "bookings",
      icon: "calendar-check",
      description: "Booking and reservations",
      fields: [
        { label: "Property", type: "relation", relationModuleSlug: "properties" },
        { label: "Customer", type: "relation", relationModuleSlug: "leads" },
        { label: "Amount", type: "currency" },
        { label: "Status", type: "select", options: ["Hold", "Confirmed", "Cancelled"] },
      ],
    },
    {
      name: "Payments",
      slug: "payments",
      icon: "credit-card",
      description: "Payment tracking",
      fields: [
        { label: "Deal", type: "relation", relationModuleSlug: "deals" },
        { label: "Amount", type: "currency" },
        { label: "Date", type: "date" },
        { label: "Status", type: "select", options: ["Pending", "Received", "Overdue"] },
      ],
    },
  ],
  pipelines: [
    {
      name: "Deal Pipeline",
      module: "deals",
      stages: ["Inquiry", "Site Visit", "Negotiation", "Booked", "Closed"],
    },
  ],
  dashboards: [
    {
      name: "Real Estate Dashboard",
      widgets: [
        wMetric("New inquiries", 0),
        wMetric("Site visits", 1),
        wMetric("Bookings", 2),
      ],
    },
  ],
  views: [
    ...defaultViews("leads"),
    ...defaultViews("properties"),
    ...defaultViews("deals"),
  ],
  roles: [
    { name: "Admin" },
    { name: "Agent" },
    { name: "Broker" },
    { name: "Manager" },
  ],
  roleDashboards: [
    { roleName: "Admin", dashboardName: "Real Estate Dashboard", orderIndex: 0 },
    { roleName: "Manager", dashboardName: "Real Estate Dashboard", orderIndex: 0 },
    { roleName: "Agent", dashboardName: "Real Estate Dashboard", orderIndex: 0 },
    { roleName: "Broker", dashboardName: "Real Estate Dashboard", orderIndex: 0 },
  ],
};

// ---------------------------------------------------------------------------
// 5. EDUCATION CRM
// ---------------------------------------------------------------------------
export const EDUCATION_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Students",
      slug: "students",
      icon: "graduation-cap",
      description: "Student records",
      fields: [
        { label: "Student Name", type: "text", required: true },
        { label: "Phone", type: "phone" },
        { label: "Email", type: "email" },
        { label: "Course", type: "text" },
        { label: "Admission Status", type: "select", options: ["Applied", "Enrolled", "Active", "Completed", "Dropped"] },
      ],
    },
    {
      name: "Admissions",
      slug: "admissions",
      icon: "clipboard-list",
      description: "Admission applications",
      fields: [
        { label: "Student", type: "relation", relationModuleSlug: "students" },
        { label: "Course", type: "relation", relationModuleSlug: "courses" },
        { label: "Status", type: "select", options: ["Applied", "Under Review", "Accepted", "Rejected"] },
        { label: "Application Date", type: "date" },
      ],
    },
    {
      name: "Courses",
      slug: "courses",
      icon: "book-open",
      description: "Course catalog",
      fields: [
        { label: "Course Name", type: "text", required: true },
        { label: "Duration", type: "text" },
        { label: "Fee", type: "currency" },
        { label: "Status", type: "select", options: ["Active", "Upcoming", "Closed"] },
      ],
    },
    {
      name: "Fees",
      slug: "fees",
      icon: "dollar-sign",
      description: "Fee collection",
      fields: [
        { label: "Student", type: "relation", relationModuleSlug: "students" },
        { label: "Amount", type: "currency" },
        { label: "Due Date", type: "date" },
        { label: "Status", type: "select", options: ["Pending", "Paid", "Overdue", "Waived"] },
      ],
    },
    {
      name: "Attendance",
      slug: "attendance",
      icon: "calendar",
      description: "Attendance tracking",
      fields: [
        { label: "Student", type: "relation", relationModuleSlug: "students" },
        { label: "Date", type: "date" },
        { label: "Status", type: "select", options: ["Present", "Absent", "Late", "Leave"] },
      ],
    },
  ],
  pipelines: [
    {
      name: "Admission Pipeline",
      module: "admissions",
      stages: ["Inquiry", "Application", "Admission", "Enrolled"],
    },
  ],
  dashboards: [
    {
      name: "Education Dashboard",
      widgets: [
        wMetric("New students", 0),
        wMetric("Course enrollments", 1),
        wMetric("Revenue", 2, { metricType: "sum", valueField: "amount" }),
      ],
    },
  ],
  views: [
    ...defaultViews("students"),
    ...defaultViews("admissions"),
    ...defaultViews("courses"),
  ],
  roles: [
    { name: "Admin" },
    { name: "Manager" },
    { name: "Counselor" },
    { name: "Staff" },
  ],
  roleDashboards: [
    { roleName: "Admin", dashboardName: "Education Dashboard", orderIndex: 0 },
    { roleName: "Manager", dashboardName: "Education Dashboard", orderIndex: 0 },
    { roleName: "Counselor", dashboardName: "Education Dashboard", orderIndex: 0 },
    { roleName: "Staff", dashboardName: "Education Dashboard", orderIndex: 0 },
  ],
};

// ---------------------------------------------------------------------------
// 6. MARKETING AGENCY CRM
// ---------------------------------------------------------------------------
export const MARKETING_AGENCY_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Leads",
      slug: "leads",
      icon: "user-plus",
      description: "Incoming leads",
      fields: [
        { label: "Company", type: "text", required: true },
        { label: "Contact Name", type: "text" },
        { label: "Email", type: "email" },
        { label: "Service Interest", type: "select", options: ["SEO", "PPC", "Social", "Content", "Full Service"] },
      ],
    },
    {
      name: "Clients",
      slug: "clients",
      icon: "building",
      description: "Client accounts",
      fields: [
        { label: "Client Name", type: "text", required: true },
        { label: "Email", type: "email" },
        { label: "Phone", type: "phone" },
      ],
    },
    {
      name: "Campaigns",
      slug: "campaigns",
      icon: "megaphone",
      description: "Marketing campaigns",
      fields: [
        { label: "Campaign Name", type: "text", required: true },
        { label: "Budget", type: "currency" },
        { label: "Start Date", type: "date" },
        { label: "End Date", type: "date" },
        { label: "Status", type: "select", options: ["Draft", "Active", "Paused", "Completed"] },
      ],
    },
    {
      name: "Projects",
      slug: "projects",
      icon: "folder",
      description: "Client projects",
      fields: [
        { label: "Project Name", type: "text", required: true },
        { label: "Client", type: "relation", relationModuleSlug: "clients" },
        { label: "Status", type: "select", options: ["Planning", "In Progress", "Review", "Completed"] },
      ],
    },
    {
      name: "Invoices",
      slug: "invoices",
      icon: "file-text",
      description: "Client invoices",
      fields: [
        { label: "Client", type: "relation", relationModuleSlug: "clients" },
        { label: "Amount", type: "currency" },
        { label: "Status", type: "select", options: ["Draft", "Sent", "Paid", "Overdue"] },
      ],
    },
    {
      name: "Payments",
      slug: "payments",
      icon: "credit-card",
      description: "Payment records",
      fields: [
        { label: "Client", type: "relation", relationModuleSlug: "clients" },
        { label: "Amount", type: "currency" },
        { label: "Date", type: "date" },
      ],
    },
  ],
  pipelines: [
    {
      name: "Lead Pipeline",
      module: "leads",
      stages: ["New", "Contacted", "Proposal", "Won", "Lost"],
    },
  ],
  dashboards: [
    {
      name: "Agency Dashboard",
      widgets: [
        wMetric("Active campaigns", 0),
        wMetric("Revenue", 1, { metricType: "sum", valueField: "amount" }),
        wMetric("Client growth", 2),
      ],
    },
  ],
  views: [
    ...defaultViews("leads"),
    ...defaultViews("clients"),
    ...defaultViews("campaigns"),
  ],
  roles: [
    { name: "Admin" },
    { name: "Account Manager" },
    { name: "Sales" },
    { name: "Director" },
  ],
  roleDashboards: [
    { roleName: "Admin", dashboardName: "Agency Dashboard", orderIndex: 0 },
    { roleName: "Director", dashboardName: "Agency Dashboard", orderIndex: 0 },
    { roleName: "Account Manager", dashboardName: "Agency Dashboard", orderIndex: 0 },
    { roleName: "Sales", dashboardName: "Agency Dashboard", orderIndex: 0 },
  ],
};

// ---------------------------------------------------------------------------
// 7. CUSTOMER SUPPORT CRM
// ---------------------------------------------------------------------------
export const CUSTOMER_SUPPORT_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Customers",
      slug: "customers",
      icon: "users",
      description: "Customer directory",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Email", type: "email" },
        { label: "Phone", type: "phone" },
      ],
    },
    {
      name: "Tickets",
      slug: "tickets",
      icon: "ticket",
      description: "Support tickets",
      fields: [
        { label: "Customer", type: "relation", relationModuleSlug: "customers" },
        { label: "Subject", type: "text", required: true },
        { label: "Priority", type: "select", options: ["Low", "Medium", "High", "Urgent"] },
        { label: "Status", type: "select", options: ["Open", "In Progress", "Waiting", "Resolved", "Closed"] },
        { label: "Assigned To", type: "user" },
      ],
    },
    {
      name: "Agents",
      slug: "agents",
      icon: "headphones",
      description: "Support agents",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Email", type: "email" },
        { label: "Team", type: "text" },
      ],
    },
    {
      name: "Knowledge Base",
      slug: "knowledge_base",
      icon: "book",
      description: "KB articles",
      fields: [
        { label: "Title", type: "text", required: true },
        { label: "Content", type: "textarea" },
        { label: "Category", type: "text" },
      ],
    },
  ],
  pipelines: [
    {
      name: "Ticket Pipeline",
      module: "tickets",
      stages: ["Open", "In Progress", "Waiting", "Resolved", "Closed"],
    },
  ],
  dashboards: [
    {
      name: "Support Dashboard",
      widgets: [
        wMetric("Open tickets", 0),
        wMetric("Resolution time", 1),
        wMetric("Agent performance", 2),
        wQuickLinks([{ label: "Create ticket" }], 3),
      ],
    },
  ],
  views: [
    ...defaultViews("customers"),
    ...defaultViews("tickets"),
  ],
  roles: [
    { name: "Admin" },
    { name: "Manager" },
    { name: "Agent" },
    { name: "Staff" },
  ],
  roleDashboards: [
    { roleName: "Admin", dashboardName: "Support Dashboard", orderIndex: 0 },
    { roleName: "Manager", dashboardName: "Support Dashboard", orderIndex: 0 },
    { roleName: "Agent", dashboardName: "Support Dashboard", orderIndex: 0 },
    { roleName: "Staff", dashboardName: "Support Dashboard", orderIndex: 0 },
  ],
};

// ---------------------------------------------------------------------------
// 8. HR / RECRUITMENT CRM
// ---------------------------------------------------------------------------
export const HR_RECRUITMENT_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Candidates",
      slug: "candidates",
      icon: "user",
      description: "Candidate pool",
      fields: [
        { label: "Candidate Name", type: "text", required: true },
        { label: "Email", type: "email" },
        { label: "Phone", type: "phone" },
        { label: "Position", type: "text" },
        { label: "Interview Status", type: "select", options: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"] },
      ],
    },
    {
      name: "Job Openings",
      slug: "job_openings",
      icon: "briefcase",
      description: "Open positions",
      fields: [
        { label: "Job Title", type: "text", required: true },
        { label: "Department", type: "text" },
        { label: "Status", type: "select", options: ["Open", "On Hold", "Filled", "Closed"] },
      ],
    },
    {
      name: "Interviews",
      slug: "interviews",
      icon: "calendar",
      description: "Interview scheduling",
      fields: [
        { label: "Candidate", type: "relation", relationModuleSlug: "candidates" },
        { label: "Position", type: "relation", relationModuleSlug: "job_openings" },
        { label: "Date", type: "date" },
        { label: "Status", type: "select", options: ["Scheduled", "Completed", "Cancelled"] },
      ],
    },
    {
      name: "Offers",
      slug: "offers",
      icon: "file-check",
      description: "Job offers",
      fields: [
        { label: "Candidate", type: "relation", relationModuleSlug: "candidates" },
        { label: "Position", type: "relation", relationModuleSlug: "job_openings" },
        { label: "Status", type: "select", options: ["Draft", "Sent", "Accepted", "Declined"] },
      ],
    },
    {
      name: "Employees",
      slug: "employees",
      icon: "users",
      description: "Employee records",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Email", type: "email" },
        { label: "Department", type: "text" },
        { label: "Join Date", type: "date" },
      ],
    },
  ],
  pipelines: [
    {
      name: "Recruitment Pipeline",
      module: "candidates",
      stages: ["Applied", "Screening", "Interview", "Offer", "Hired"],
    },
  ],
  dashboards: [
    {
      name: "HR Dashboard",
      widgets: [
        wMetric("Candidates pipeline", 0),
        wMetric("Hires this month", 1),
      ],
    },
  ],
  views: [
    ...defaultViews("candidates"),
    ...defaultViews("job_openings"),
    ...defaultViews("interviews"),
  ],
  roles: [
    { name: "Admin" },
    { name: "HR Manager" },
    { name: "Recruiter" },
    { name: "Staff" },
  ],
  roleDashboards: [
    { roleName: "Admin", dashboardName: "HR Dashboard", orderIndex: 0 },
    { roleName: "HR Manager", dashboardName: "HR Dashboard", orderIndex: 0 },
    { roleName: "Recruiter", dashboardName: "HR Dashboard", orderIndex: 0 },
    { roleName: "Staff", dashboardName: "HR Dashboard", orderIndex: 0 },
  ],
};

// ---------------------------------------------------------------------------
// 9. ECOMMERCE CRM
// ---------------------------------------------------------------------------
export const ECOMMERCE_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Customers",
      slug: "customers",
      icon: "users",
      description: "Customer directory",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Email", type: "email" },
        { label: "Phone", type: "phone" },
      ],
    },
    {
      name: "Orders",
      slug: "orders",
      icon: "shopping-cart",
      description: "Order management",
      fields: [
        { label: "Order ID", type: "text", required: true },
        { label: "Customer", type: "relation", relationModuleSlug: "customers" },
        { label: "Product", type: "relation", relationModuleSlug: "products" },
        { label: "Amount", type: "currency" },
        { label: "Order Status", type: "select", options: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"] },
      ],
    },
    {
      name: "Products",
      slug: "products",
      icon: "package",
      description: "Product catalog",
      fields: [
        { label: "Product Name", type: "text", required: true },
        { label: "SKU", type: "text" },
        { label: "Price", type: "currency" },
        { label: "Status", type: "select", options: ["Active", "Out of Stock", "Discontinued"] },
      ],
    },
    {
      name: "Payments",
      slug: "payments",
      icon: "credit-card",
      description: "Payment records",
      fields: [
        { label: "Order", type: "relation", relationModuleSlug: "orders" },
        { label: "Amount", type: "currency" },
        { label: "Date", type: "date" },
        { label: "Status", type: "select", options: ["Pending", "Completed", "Failed", "Refunded"] },
      ],
    },
    {
      name: "Returns",
      slug: "returns",
      icon: "rotate-ccw",
      description: "Return requests",
      fields: [
        { label: "Order", type: "relation", relationModuleSlug: "orders" },
        { label: "Reason", type: "text" },
        { label: "Status", type: "select", options: ["Requested", "Approved", "Received", "Refunded"] },
      ],
    },
  ],
  pipelines: [
    {
      name: "Order Pipeline",
      module: "orders",
      stages: ["Pending", "Confirmed", "Shipped", "Delivered"],
    },
  ],
  dashboards: [
    {
      name: "Ecommerce Dashboard",
      widgets: [
        wMetric("Orders today", 0),
        wMetric("Revenue", 1, { metricType: "sum", valueField: "amount" }),
        wChart("bar_chart", "Top products", 2),
      ],
    },
  ],
  views: [
    ...defaultViews("customers"),
    ...defaultViews("orders"),
    ...defaultViews("products"),
  ],
  roles: [
    { name: "Admin" },
    { name: "Manager" },
    { name: "Staff" },
  ],
  roleDashboards: [
    { roleName: "Admin", dashboardName: "Ecommerce Dashboard", orderIndex: 0 },
    { roleName: "Manager", dashboardName: "Ecommerce Dashboard", orderIndex: 0 },
    { roleName: "Staff", dashboardName: "Ecommerce Dashboard", orderIndex: 0 },
  ],
};

// ---------------------------------------------------------------------------
// 10. SERVICE BUSINESS CRM
// ---------------------------------------------------------------------------
export const SERVICE_BUSINESS_CRM_TEMPLATE: CrmTemplateJSON = {
  modules: [
    {
      name: "Customers",
      slug: "customers",
      icon: "users",
      description: "Customer directory",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Email", type: "email" },
        { label: "Phone", type: "phone" },
      ],
    },
    {
      name: "Service Requests",
      slug: "service_requests",
      icon: "wrench",
      description: "Service requests",
      fields: [
        { label: "Service Request", type: "text", required: true },
        { label: "Customer", type: "relation", relationModuleSlug: "customers" },
        { label: "Technician", type: "relation", relationModuleSlug: "technicians" },
        { label: "Status", type: "select", options: ["New Request", "Assigned", "In Progress", "Completed", "Cancelled"] },
        { label: "Scheduled Date", type: "date" },
      ],
    },
    {
      name: "Technicians",
      slug: "technicians",
      icon: "user-cog",
      description: "Technician roster",
      fields: [
        { label: "Name", type: "text", required: true },
        { label: "Phone", type: "phone" },
        { label: "Skills", type: "text" },
      ],
    },
    {
      name: "Work Orders",
      slug: "work_orders",
      icon: "clipboard",
      description: "Work orders",
      fields: [
        { label: "Request", type: "relation", relationModuleSlug: "service_requests" },
        { label: "Technician", type: "relation", relationModuleSlug: "technicians" },
        { label: "Status", type: "select", options: ["Draft", "Scheduled", "In Progress", "Completed"] },
      ],
    },
    {
      name: "Invoices",
      slug: "invoices",
      icon: "file-text",
      description: "Invoicing",
      fields: [
        { label: "Customer", type: "relation", relationModuleSlug: "customers" },
        { label: "Amount", type: "currency" },
        { label: "Status", type: "select", options: ["Draft", "Sent", "Paid", "Overdue"] },
      ],
    },
  ],
  pipelines: [
    {
      name: "Service Pipeline",
      module: "service_requests",
      stages: ["New Request", "Assigned", "In Progress", "Completed"],
    },
  ],
  dashboards: [
    {
      name: "Service Dashboard",
      widgets: [
        wMetric("Requests today", 0),
        wMetric("Completed jobs", 1),
        wMetric("Technician performance", 2),
      ],
    },
  ],
  views: [
    ...defaultViews("customers"),
    ...defaultViews("service_requests"),
  ],
  roles: [
    { name: "Admin" },
    { name: "Manager" },
    { name: "Technician" },
    { name: "Staff" },
  ],
  roleDashboards: [
    { roleName: "Admin", dashboardName: "Service Dashboard", orderIndex: 0 },
    { roleName: "Manager", dashboardName: "Service Dashboard", orderIndex: 0 },
    { roleName: "Technician", dashboardName: "Service Dashboard", orderIndex: 0 },
    { roleName: "Staff", dashboardName: "Service Dashboard", orderIndex: 0 },
  ],
};

// ---------------------------------------------------------------------------
// All industry templates for seeding
// ---------------------------------------------------------------------------
export interface IndustryTemplateMeta {
  name: string;
  category: string;
  description: string;
  icon: string;
  json: CrmTemplateJSON;
}

export const INDUSTRY_TEMPLATES: IndustryTemplateMeta[] = [
  {
    name: "Sales CRM",
    category: "Sales",
    description: "Universal sales CRM: Leads, Contacts, Companies, Deals, Activities, Tasks. Sales pipeline and dashboard.",
    icon: "trending-up",
    json: SALES_CRM_TEMPLATE,
  },
  {
    name: "Loan / Finance CRM",
    category: "Finance",
    description: "Loan lifecycle: Leads, Applicants, Loans, Documents, Approvals, Disbursements. Finance dashboard.",
    icon: "credit-card",
    json: LOAN_FINANCE_CRM_TEMPLATE,
  },
  {
    name: "Healthcare CRM",
    category: "Healthcare",
    description: "Patients, Appointments, Doctors, Treatments, Prescriptions, Billing, Payments. Clinic dashboard with quick actions.",
    icon: "heart-pulse",
    json: HEALTHCARE_CRM_TEMPLATE,
  },
  {
    name: "Real Estate CRM",
    category: "Real Estate",
    description: "Leads, Properties, Site Visits, Deals, Bookings, Payments. Deal pipeline and property dashboard.",
    icon: "home",
    json: REAL_ESTATE_CRM_TEMPLATE,
  },
  {
    name: "Education CRM",
    category: "Education",
    description: "Students, Admissions, Courses, Fees, Attendance. Admission pipeline and education dashboard.",
    icon: "graduation-cap",
    json: EDUCATION_CRM_TEMPLATE,
  },
  {
    name: "Marketing Agency CRM",
    category: "Marketing",
    description: "Leads, Clients, Campaigns, Projects, Invoices, Payments. Agency dashboard and lead pipeline.",
    icon: "megaphone",
    json: MARKETING_AGENCY_CRM_TEMPLATE,
  },
  {
    name: "Customer Support CRM",
    category: "Support",
    description: "Customers, Tickets, Agents, Knowledge Base. Ticket pipeline and support dashboard.",
    icon: "headphones",
    json: CUSTOMER_SUPPORT_CRM_TEMPLATE,
  },
  {
    name: "HR / Recruitment CRM",
    category: "HR",
    description: "Candidates, Job Openings, Interviews, Offers, Employees. Recruitment pipeline and HR dashboard.",
    icon: "users",
    json: HR_RECRUITMENT_CRM_TEMPLATE,
  },
  {
    name: "Ecommerce CRM",
    category: "Ecommerce",
    description: "Customers, Orders, Products, Payments, Returns. Order pipeline and ecommerce dashboard.",
    icon: "shopping-cart",
    json: ECOMMERCE_CRM_TEMPLATE,
  },
  {
    name: "Service Business CRM",
    category: "Support",
    description: "Customers, Service Requests, Technicians, Work Orders, Invoices. Service pipeline and dashboard.",
    icon: "wrench",
    json: SERVICE_BUSINESS_CRM_TEMPLATE,
  },
];
