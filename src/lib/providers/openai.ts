import { requireEnv, safeJson } from "@/lib/utils";

type ChatMsg = { role: "system" | "user"; content: string };

export async function callOpenAI(params: {
  model: string;
  messages: ChatMsg[];
  temperature?: number;
}) {
  const key = requireEnv("OPENAI_API_KEY");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.2
    })
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${t}`);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  return { text, json, parsed: safeJson(text) };
}
