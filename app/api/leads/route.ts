import { NextResponse } from "next/server";
import { listLeads } from "@/lib/db";

export async function GET() {
  try {
    const leads = await listLeads();
    return NextResponse.json({ ok: true, leads });
  } catch (err) {
    console.error("GET /api/leads failed:", err);
    return NextResponse.json({ ok: false, leads: [] }, { status: 500 });
  }
}
