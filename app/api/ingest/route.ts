import { NextRequest, NextResponse } from "next/server";
import { upsertLead, getLead, updateLead } from "@/lib/db";
import { newId } from "@/lib/utils";
import { callOpenAI } from "@/lib/providers/openai";
import { notionCreateTask } from "@/lib/providers/notion";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const message = body?.message || body?.rawMessage || body?.text || "";
  const source = body?.source || "web";

  if (!message) {
    return NextResponse.json({ ok: false, error: "Missing message" }, { status: 400 });
  }

  // 1) Create + store lead
  const leadId = body?.leadId || newId();
  const lead = {
    id: leadId,
    createdAt: new Date().toISOString(),
    source,
    rawMessage: message,
    status: "New",
    summary: null,
    priority: null,
    nextStep: null,
    questions: [],
    draftReply: null,
    aiLog: {},
  };

  upsertLead(lead as any);

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

  const current1 = getLead(leadId);
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

  upsertLead(updatedAfterAnalyze as any);

  // 3) Create Notion task
  const notionRes = await notionCreateTask({
    title: "Follow up: New lead",
    notes: `Summary:\n${updatedAfterAnalyze.summary ?? "(none)"}\n\nRaw:\n${message}`,
    priority: updatedAfterAnalyze.priority ?? "P3",
    leadId: leadId,
  });

  // Store Notion page ID on lead
  const updatedAfterNotion = updateLead(leadId, {
    status: "Tasked",
    aiLog: { ...(updatedAfterAnalyze.aiLog ?? {}), notion: { pageId: notionRes.id } },
  } as any);

  if (!updatedAfterNotion) {
    return NextResponse.json({ ok: false, error: "Lead not found after Notion" }, { status: 500 });
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

  const finalLead = updateLead(leadId, {
    draftReply: draft.text,
    status: "Drafted",
    aiLog: { ...(updatedAfterNotion.aiLog ?? {}), draftReply: true },
  } as any);

  if (!finalLead) {
    return NextResponse.json({ ok: false, error: "Lead not found after draft" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    lead: finalLead,
    notion: { pageId: notionRes.id },
    draft: finalLead.draftReply,
  });
}
