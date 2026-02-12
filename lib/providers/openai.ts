import OpenAI from "openai";
import { safeJson } from "@/lib/utils";

/**
 * Lazy OpenAI client:
 * - Does NOT throw on import
 * - Throws only when you actually try to call OpenAI
 * - Allows your app (and ingest DB writes) to still work without AI configured
 */
function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;

  if (!key) return null;

  return new OpenAI({ apiKey: key });
}

export async function callOpenAI(params: {
  model?: string;
  input: string;
  temperature?: number;
}) {
  const client = getOpenAIClient();

  // If AI not configured, return a safe fallback instead of crashing
  if (!client) {
    return {
      text: "",
      parsed: null,
      raw: null,
      disabled: true as const,
    };
  }

  const res = await client.responses.create({
    model: params.model ?? "gpt-4o-mini", // MODEL SELECTED HERE
    input: params.input,
    temperature: params.temperature ?? 0.2,
  });

  const text = res.output_text?.trim() ?? "";

  return {
    text,
    parsed: safeJson(text),
    raw: res,
    disabled: false as const,
  };
}
