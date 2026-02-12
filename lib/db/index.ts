import { eq, desc, and } from "drizzle-orm";
import { db } from "./client";
import { leads, threads, messages, activities } from "./schema";

export type LeadRow = typeof leads.$inferSelect;
export type LeadInsert = typeof leads.$inferInsert;

export type ThreadRow = typeof threads.$inferSelect;
export type ThreadInsert = typeof threads.$inferInsert;

export type MessageRow = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;

export type ActivityRow = typeof activities.$inferSelect;
export type ActivityInsert = typeof activities.$inferInsert;

const ORG_DEFAULT = "org_demo";

/* ----------------------------- LEADS ----------------------------- */

export async function upsertLead(lead: LeadInsert) {
  const [row] = await db
    .insert(leads)
    .values(lead)
    .onConflictDoUpdate({
      target: leads.id,
      set: {
        organizationId: lead.organizationId ?? ORG_DEFAULT,
        source: lead.source ?? "web",
        rawMessage: lead.rawMessage,
        status: lead.status ?? "New",
        summary: lead.summary ?? null,
        priority: lead.priority ?? null,
        nextStep: lead.nextStep ?? null,
        questions: (lead.questions ?? []) as any,
        draftReply: lead.draftReply ?? null,
        aiLog: (lead.aiLog ?? {}) as any,
      },
    })
    .returning();

  return row ?? null;
}

export async function getLead(id: string) {
  const [row] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return row ?? null;
}

export async function listLeads(orgId = ORG_DEFAULT) {
  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.organizationId, orgId))
    .orderBy(desc(leads.createdAt));
  return rows;
}

export async function updateLead(id: string, patch: Partial<LeadInsert>) {
  const [row] = await db.update(leads).set({ ...patch }).where(eq(leads.id, id)).returning();
  return row ?? null;
}

/* ----------------------------- THREADS ----------------------------- */

export async function createThreadForLead(args: {
  orgId?: string;
  leadId: string;
  channel: "email" | "sms" | "dm";
  status?: "unread" | "needs_approval" | "active" | "closed";
  initialText?: string;
}) {
  const orgId = args.orgId ?? ORG_DEFAULT;
  const id = args.leadId.startsWith("lead_")
    ? `t_${args.leadId}`
    : `t_${Math.random().toString(36).slice(2, 10)}`;

  const now = new Date();

  const [row] = await db
    .insert(threads)
    .values({
      id,
      organizationId: orgId,
      leadId: args.leadId,
      channel: args.channel,
      status: args.status ?? "unread",
      lastText: args.initialText ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: threads.id,
      set: {
        lastText: args.initialText ?? null,
        updatedAt: now,
      },
    })
    .returning();

  return row ?? null;
}

export async function listThreads(orgId = ORG_DEFAULT) {
  // join thread + lead name/summary/priority etc for Queue rendering
  const rows = await db
    .select({
      thread: threads,
      lead: leads,
    })
    .from(threads)
    .leftJoin(leads, eq(leads.id, threads.leadId))
    .where(eq(threads.organizationId, orgId))
    .orderBy(desc(threads.updatedAt));

  return rows;
}

export async function getThread(orgId: string, threadId: string) {
  const [row] = await db
    .select({
      thread: threads,
      lead: leads,
    })
    .from(threads)
    .leftJoin(leads, eq(leads.id, threads.leadId))
    .where(and(eq(threads.organizationId, orgId), eq(threads.id, threadId)))
    .limit(1);

  return row ?? null;
}

export async function updateThread(threadId: string, patch: Partial<ThreadInsert>) {
  const [row] = await db.update(threads).set({ ...patch }).where(eq(threads.id, threadId)).returning();
  return row ?? null;
}

/* ----------------------------- MESSAGES ----------------------------- */

export async function listMessages(orgId: string, threadId: string) {
  const rows = await db
    .select()
    .from(messages)
    .where(and(eq(messages.organizationId, orgId), eq(messages.threadId, threadId)))
    .orderBy(desc(messages.at));
  // UI wants oldest → newest, so reverse
  return rows.reverse();
}

export async function addMessage(args: {
  orgId?: string;
  threadId: string;
  from: "customer" | "ai" | "human";
  text: string;
  at?: Date;
}) {
  const orgId = args.orgId ?? ORG_DEFAULT;
  const [row] = await db
    .insert(messages)
    .values({
      id: `m_${Math.random().toString(36).slice(2, 10)}`,
      organizationId: orgId,
      threadId: args.threadId,
      from: args.from,
      text: args.text,
      at: args.at ?? new Date(),
    })
    .returning();

  return row ?? null;
}

/* ----------------------------- ACTIVITIES ----------------------------- */

export async function listActivities(orgId: string, threadId: string) {
  const rows = await db
    .select()
    .from(activities)
    .where(and(eq(activities.organizationId, orgId), eq(activities.threadId, threadId)))
    .orderBy(desc(activities.at));
  return rows;
}

export async function addActivity(args: {
  orgId?: string;
  threadId: string;
  type: string;
  detail?: string;
  outcome?: "ok" | "pending" | "blocked";
  at?: Date;
}) {
  const orgId = args.orgId ?? ORG_DEFAULT;
  const [row] = await db
    .insert(activities)
    .values({
      id: `a_${Math.random().toString(36).slice(2, 10)}`,
      organizationId: orgId,
      threadId: args.threadId,
      type: args.type,
      detail: args.detail ?? null,
      outcome: args.outcome ?? null,
      at: args.at ?? new Date(),
    })
    .returning();

  return row ?? null;
}
