import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, name: "axiom-agent-mvp" });
}
