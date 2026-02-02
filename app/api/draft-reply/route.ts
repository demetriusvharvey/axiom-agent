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
Write a short professional reply. Goal: book a call and ask 1-2 clarifying questions.
Return plain text only.

Lead:
${lead.rawMessage}

Summary:
${(lead as any).summary ?? "(none)"}
Priority:
${(lead as any).priority ?? "(none)"}
`.trim();

  const resp = await openai.responses.create({
    model: "gpt-4o-mini", // <-- MODEL IS CHOSEN HERE
    input: prompt,
  });

  const draft = resp.output_text?.trim() ?? "";

  const updated = updateLead(lead.id, {
    draftReply: draft,
    status: "Drafted",
  } as any);

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Lead not found after update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, draft, lead: updated });
}
