import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { threads, messages, activities, leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await ctx.params;

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || "").trim();

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Missing text" },
        { status: 400 }
      );
    }

    // Get thread to ensure it exists + leadId for optional lead update
    const [t] = await db
      .select()
      .from(threads)
      .where(eq(threads.id, threadId))
      .limit(1);

    if (!t) {
      return NextResponse.json(
        { ok: false, error: "Thread not found" },
        { status: 404 }
      );
    }

    const now = new Date();

    // 1) Insert human message
    const [sentMsg] = await db
      .insert(messages)
      .values({
        id: newId("m"),
        threadId,
        from: "human",
        text,
        at: now,
      })
      .returning();

    // 2) Update thread status + lastText + updatedAt
    const [updatedThread] = await db
      .update(threads)
      .set({
        status: "active",
        lastText: text,
        updatedAt: now,
      })
      .where(eq(threads.id, threadId))
      .returning();

    // 3) Ops feed: action sent
    await db.insert(activities).values({
      id: newId("a"),
      threadId,
      type: "action_sent",
      detail: "Approved and sent response.",
      outcome: "ok",
      at: now,
    });

    // 4) Ops feed: follow-up scheduled (placeholder)
    await db.insert(activities).values({
      id: newId("a"),
      threadId,
      type: "followup_scheduled",
      detail: "Auto follow-up scheduled in 24h if no reply.",
      outcome: "pending",
      at: now,
    });

    // 5) OPTIONAL: update lead status so Leads page shows progress
    try {
      if (t.leadId) {
        await db
          .update(leads)
          .set({ status: "Contacted" })
          .where(eq(leads.id, t.leadId));
      }
    } catch {}

    return NextResponse.json({
      ok: true,
      thread: updatedThread,
      message: sentMsg,
    });
  } catch (err: any) {
    console.error("POST /api/threads/[id]/approve failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
