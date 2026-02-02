import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/utils";

export async function GET() {
  const token = requireEnv("NOTION_API_KEY");
  const dbId = requireEnv("NOTION_DATABASE_ID");

  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28"
    }
  });

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json({ ok: false, status: res.status, error: text }, { status: 500 });
  }

  const db = JSON.parse(text);
  const props = db?.properties ?? {};
  const names = Object.keys(props);

  // Return names + types so we can map correctly
  const summary = names.map((n: string) => ({
    name: n,
    type: props[n]?.type
  }));

  return NextResponse.json({ ok: true, database_id: dbId, properties: summary });
}
