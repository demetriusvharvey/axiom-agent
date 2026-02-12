import { NextRequest, NextResponse } from "next/server";
import {
  upsertLead,
  getLead,
  updateLead,
  createThreadForLead,
  addMessage,
  addActivity,
  updateThread,
} from "@/lib/db";
import { newId } from "@/lib/utils";
import { callOpenAI } from "@/lib/providers/openai";
import { notionCreateTask } from "@/lib/providers/notion";

const ORG_DEFAULT = "org_demo";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const message = body?.message || body?.rawMessage || body?.text || "";
  const source = body?.source || "web";
  const channel = (body?.channel || body?.via || "email") as "email" | "sms" | "dm";

  // ✅ identity fields (optional)
  const firstName = body?.firstName ?? body?.first_name ?? null;
  const lastName = body?.lastName ?? body?.last_name ?? null;
  const email = body?.email ?? null;
  const company = body?.company ?? null;

  if (!message) {
    return NextResponse.json({ ok: false, error: "Missing message" }, { status: 400 });
  }

  // 1) Create + store lead
  const leadId = body?.leadId || newId();
  const nowIso = new Date().toISOString();

  const lead = {
    id: leadId,
    organizationId: ORG_DEFAULT,
    createdAt: new Date(nowIso),
    source,
    rawMessage: message,

    // ✅ Save identity so UI can show names
    firstName,
    lastName,
    email,
    company,

    status: "New",
    summary: null,
    priority: null,
    nextStep: null,
    questions: [],
    draftReply: null,
    aiLog: {},
  };

  await upsertLead(lead as any);

  // 1b) Create / upsert thread for this lead
  const thread = await createThreadForLead({
    orgId: ORG_DEFAULT,
    leadId,
    channel,
    status: "unread",
    initialText: message,
  });

  if (!thread) {
    return NextResponse.json({ ok: false, error: "Thread create failed" }, { status: 500 });
  }

  // 1c) Store inbound message
  await addMessage({
    orgId: ORG_DEFAULT,
    threadId: thread.id,
    from: "customer",
    text: message,
    at: new Date(nowIso),
  });

  // 1d) Ops feed: ingested
  await addActivity({
    orgId: ORG_DEFAULT,
    threadId: thread.id,
    type: "ingested",
    detail: "Inbound message captured and thread created.",
    outcome: "ok",
    at: new Date(nowIso),
  });

  // 2) Analyze with OpenAI
  const analyzePrompt = `
Return JSON only:
{
  "summary": "1-2 sentences",
  "priority": "P1|P2|P3|P4",
  "nextStep": "string",
  "questions": ["q1","q2","q3"]
}

Lead message:
${message}
  `.trim();

  const analyze = await callOpenAI({ input: analyzePrompt });
  const parsed = analyze.parsed || {};

  const current1 = await getLead(leadId);
  if (!current1) {
    return NextResponse.json({ ok: false, error: "Lead not found after insert" }, { status: 500 });
  }

  const updatedAfterAnalyze = {
    ...current1,
    summary: parsed.summary ?? analyze.text,
    priority: parsed.priority ?? "P3",
    nextStep: parsed.nextStep ?? "Review and follow up",
    questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    status: "Analyzed",
    aiLog: { ...(current1.aiLog ?? {}), analyze: parsed },
  };

  await upsertLead(updatedAfterAnalyze as any);

  await addActivity({
    orgId: ORG_DEFAULT,
    threadId: thread.id,
    type: "lead_scored",
    detail: `Lead analyzed. Priority ${updatedAfterAnalyze.priority ?? "P3"}.`,
    outcome: "ok",
  });

  // 3) Create Notion task (optional provider)
  let notionPageId: string | null = null;
  try {
    const notionRes = await notionCreateTask({
      title: "Follow up: New lead",
      notes: `Summary:\n${updatedAfterAnalyze.summary ?? "(none)"}\n\nRaw:\n${message}`,
      priority: updatedAfterAnalyze.priority ?? "P3",
      leadId: leadId,
    });

    notionPageId = notionRes?.id ?? null;

    await updateLead(leadId, {
      status: "Tasked",
      aiLog: { ...(updatedAfterAnalyze.aiLog ?? {}), notion: { pageId: notionPageId } },
    } as any);

    await addActivity({
      orgId: ORG_DEFAULT,
      threadId: thread.id,
      type: "task_created",
      detail: notionPageId ? "Notion task created." : "Task created.",
      outcome: "ok",
    });
  } catch (e) {
    // Don’t fail ingest if Notion fails
    await addActivity({
      orgId: ORG_DEFAULT,
      threadId: thread.id,
      type: "task_create_failed",
      detail: "Notion task creation failed.",
      outcome: "blocked",
    });
  }

  // 4) Draft reply with OpenAI
  const draftPrompt = `
Write a short professional reply. Goal: book a call and ask 1-2 clarifying questions.
Return plain text only.

Lead:
${message}

Summary:
${updatedAfterAnalyze.summary ?? "(none)"}
Priority:
${updatedAfterAnalyze.priority ?? "(none)"}
  `.trim();

  const draft = await callOpenAI({ input: draftPrompt });
  const draftText = draft.text?.trim() ?? "";

  const finalLead = await updateLead(leadId, {
    draftReply: draftText,
    status: "Drafted",
    aiLog: { ...(updatedAfterAnalyze.aiLog ?? {}), draftReply: true },
  } as any);

  // Store AI proposed action as message
  if (draftText) {
    await addMessage({
      orgId: ORG_DEFAULT,
      threadId: thread.id,
      from: "ai",
      text: `Draft: ${draftText}`,
    });

    // Thread now needs approval
    await updateThread(thread.id, {
      status: "needs_approval",
      lastText: message,
      updatedAt: new Date(),
    } as any);

    await addActivity({
      orgId: ORG_DEFAULT,
      threadId: thread.id,
      type: "draft_generated",
      detail: "AI draft generated for human review.",
      outcome: "pending",
    });
  }

  return NextResponse.json({
    ok: true,
    lead: finalLead ?? updatedAfterAnalyze,
    threadId: thread.id,
    notion: { pageId: notionPageId },
    draft: draftText,
  });
}
