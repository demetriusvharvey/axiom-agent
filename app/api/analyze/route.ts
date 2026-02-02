import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/providers/openai";
import { getLead, updateLead } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { leadId } = await req.json();

  const lead = getLead(leadId);
  if (!lead) {
    return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
  }

  const prompt = `
Return JSON only with:
{
  "summary": "1-2 sentences",
  "priority": "P1|P2|P3|P4",
  "nextStep": "string",
  "questions": ["q1","q2","q3"]
}

Lead message:
${lead.rawMessage}
`.trim();

  const resp = await openai.responses.create({
    model: "gpt-4o-mini", // <-- MODEL IS CHOSEN HERE
    input: prompt,
  });

  const text = resp.output_text?.trim() ?? "";

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { summary: text, priority: "P3", nextStep: "Review", questions: [] };
  }

  const updated = updateLead(lead.id, {
    summary: parsed.summary ?? null,
    priority: parsed.priority ?? "P3",
    nextStep: parsed.nextStep ?? null,
    questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    status: "Analyzed",
    aiLog: { ...(lead.aiLog ?? {}), analyze: parsed },
  } as any);

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Lead not found after update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, lead: updated });
}
