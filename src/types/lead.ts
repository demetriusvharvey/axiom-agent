export type LeadSource = "formspree" | "manual" | "email";

export type ServiceType = "web_dev" | "ai_automation" | "content" | "support" | "other";
export type Priority = "P1" | "P2" | "P3" | "P4";
export type LeadStatus = "New" | "Analyzed" | "Drafted" | "Tasked" | "Contacted" | "Closed";

export interface Lead {
  id: string;
  createdAt: string;
  source: LeadSource;
  rawMessage: string;

  // extracted (optional until analyzed)
  name?: string;
  email?: string;
  company?: string;

  serviceType?: ServiceType;
  priority?: Priority;
  summary?: string;
  budgetEstimate?: string;
  timeline?: string;
  missingInfo?: string[];

  draftReply?: string;
  status: LeadStatus;

  // store model decisions for later training
  aiLog?: Record<string, any>;
}
