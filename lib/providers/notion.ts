import { requireEnv } from "@/lib/utils";

export async function notionCreateTask(params: {
  title: string;
  notes?: string;
  leadId?: string;
  priority?: string;
}) {
  const token = requireEnv("NOTION_API_KEY");
  const dbId = requireEnv("NOTION_DATABASE_ID");

  // NOTE: Your Notion database must have properties:
  // Name (title), Notes (rich_text), LeadId (rich_text), Priority (select) OR adjust below.
  const body = {
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: params.title } }] },
      Notes: { rich_text: [{ text: { content: params.notes ?? "" } }] },
      LeadId: { rich_text: [{ text: { content: params.leadId ?? "" } }] },
      Priority: params.priority ? { select: { name: params.priority } } : undefined
    }
  };

  // Remove undefined fields to avoid Notion API complaints
  if (!params.priority) delete (body.properties as any).Priority;

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Notion error: ${res.status} ${t}`);
  }

  return res.json();
}
