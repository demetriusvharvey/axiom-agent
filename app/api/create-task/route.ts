import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead } from "@/lib/db";
import { notionCreateTask } from "@/lib/providers/notion";

export async function POST(req: NextRequest) {
  const { leadId } = await req.json();

  const lead = getLead(leadId);
  if (!lead) {
    return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
  }

  const title = `Follow up: ${(lead as any).company ?? (lead as any).name ?? "New lead"}`;
  const notes = `Summary:\n${(lead as any).summary ?? "(none)"}\n\nRaw:\n${lead.rawMessage}`;

  const notionRes = await notionCreateTask({
    title,
    notes,
    leadId: lead.id,
    priority: (lead as any).priority,
  });

  const updated = updateLead(lead.id, {
    status: "Tasked",
    aiLog: { ...(lead.aiLog ?? {}), notion: { pageId: notionRes?.id } },
  } as any);

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Lead not found after update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, notion: notionRes, lead: updated });
}
