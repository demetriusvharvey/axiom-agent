import { NextRequest, NextResponse } from "next/server";
import { getLead, listLeads } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params; // ✅ IMPORTANT in Next 16
    const leadId = String(id || "").trim();

    const lead = getLead(leadId);

    if (!lead) {
      const sampleIds = listLeads(5).map((l: any) => l.id);
      return NextResponse.json(
        { ok: false, error: "Lead not found", requestedId: leadId, sampleIds },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, lead });
  } catch (err: any) {
    console.error("GET /api/leads/[id] failed:", err);
    return NextResponse.json(
      { ok: false, error: "Internal error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
