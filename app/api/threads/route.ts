import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { threads, leads } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

function leadDisplayName(r: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  company: string | null;
  rawMessage: string | null;
  leadId: string;
}) {
  const full = [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (r.company) return r.company;
  if (r.email) return r.email;
  if (r.rawMessage) return r.rawMessage.slice(0, 48);
  return `Lead #${r.leadId.slice(-4)}`;
}

export async function GET() {
  try {
    const rows = await db
      .select({
        id: threads.id,
        leadId: threads.leadId,
        channel: threads.channel,
        status: threads.status,
        lastText: threads.lastText,
        updatedAt: threads.updatedAt,

        firstName: leads.firstName,
        lastName: leads.lastName,
        email: leads.email,
        company: leads.company,
        rawMessage: leads.rawMessage,
      })
      .from(threads)
      .leftJoin(leads, eq(threads.leadId, leads.id))
      .orderBy(desc(threads.updatedAt));

    const formatted = rows.map((r) => ({
      id: r.id,
      leadId: r.leadId,
      name: leadDisplayName({
        firstName: r.firstName ?? null,
        lastName: r.lastName ?? null,
        email: r.email ?? null,
        company: r.company ?? null,
        rawMessage: r.rawMessage ?? null,
        leadId: r.leadId,
      }),
      channel: r.channel,
      status: r.status,
      lastText: r.lastText ?? "",
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json({ ok: true, threads: formatted });
  } catch (err) {
    console.error("GET /api/threads failed:", err);
    return NextResponse.json({ ok: false, threads: [] }, { status: 500 });
  }
}
