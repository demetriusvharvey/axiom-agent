import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { threads, leads, messages, activities } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await ctx.params;

    // 1) thread + lead (for header)
    const [row] = await db
      .select({
        thread: threads,
        lead: leads,
      })
      .from(threads)
      .leftJoin(leads, eq(threads.leadId, leads.id))
      .where(eq(threads.id, threadId))
      .limit(1);

    if (!row?.thread) {
      return NextResponse.json(
        { ok: false, error: "Thread not found" },
        { status: 404 }
      );
    }

    // 2) messages oldest -> newest
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(asc(messages.at));

    // 3) activities newest -> oldest (Ops feed)
    const acts = await db
      .select()
      .from(activities)
      .where(eq(activities.threadId, threadId))
      .orderBy(asc(activities.at)); // change to desc if you want newest first

    return NextResponse.json({
      ok: true,
      thread: row.thread,
      lead: row.lead,
      messages: msgs,
      activities: acts,
    });
  } catch (err: any) {
    console.error("GET /api/threads/[id] failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
