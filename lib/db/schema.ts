import {
  pgTable,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * LEADS
 * Core lead entity (multi-tenant SaaS ready)
 */
export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),

    // Multi-tenant (default for now)
    organizationId: text("organization_id").notNull().default("org_demo"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    source: text("source").notNull().default("web"),
    rawMessage: text("raw_message").notNull(),

    // ✅ Contact identity (so UI shows a person, not a UUID)
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    company: text("company"),

    status: text("status").notNull().default("New"),

    summary: text("summary"),
    priority: text("priority"),
    nextStep: text("next_step"),

    questions: jsonb("questions").notNull().default([]),

    draftReply: text("draft_reply"),

    // store analyze payloads, notion page id, etc.
    aiLog: jsonb("ai_log").notNull().default({}),
  },
  (t) => ({
    orgIdx: index("leads_org_idx").on(t.organizationId),
    createdIdx: index("leads_created_idx").on(t.createdAt),

    // ✅ Optional indexes for faster lookups later
    emailIdx: index("leads_email_idx").on(t.email),
    companyIdx: index("leads_company_idx").on(t.company),
  })
);

/**
 * THREADS
 * Conversation container for a lead (email/sms/dm)
 */
export const threads = pgTable(
  "threads",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default("org_demo"),
    leadId: text("lead_id").notNull(),

    channel: text("channel").notNull(), // email | sms | dm (enforce in app for now)
    status: text("status").notNull().default("unread"), // unread | needs_approval | active | closed

    lastText: text("last_text"),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    orgIdx: index("threads_org_idx").on(t.organizationId),
    leadIdx: index("threads_lead_idx").on(t.leadId),
    updatedIdx: index("threads_updated_idx").on(t.updatedAt),
  })
);

/**
 * MESSAGES
 * Individual messages in a thread (customer / ai / human)
 */
export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default("org_demo"),
    threadId: text("thread_id").notNull(),

    from: text("from").notNull(), // customer | ai | human
    text: text("text").notNull(),

    at: timestamp("at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    orgIdx: index("messages_org_idx").on(t.organizationId),
    threadIdx: index("messages_thread_idx").on(t.threadId),
    atIdx: index("messages_at_idx").on(t.at),
  })
);

/**
 * ACTIVITIES
 * Ops feed (ingested, scored, draft generated, follow-up scheduled, approved, sent, etc.)
 */
export const activities = pgTable(
  "activities",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default("org_demo"),
    threadId: text("thread_id").notNull(),

    type: text("type").notNull(),
    detail: text("detail"),
    outcome: text("outcome"), // ok | pending | blocked

    at: timestamp("at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    orgIdx: index("activities_org_idx").on(t.organizationId),
    threadIdx: index("activities_thread_idx").on(t.threadId),
    atIdx: index("activities_at_idx").on(t.at),
  })
);
