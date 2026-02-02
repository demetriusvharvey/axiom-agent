import OpenAI from "openai";
import { requireEnv, safeJson } from "@/lib/utils";

export const openai = new OpenAI({
  apiKey: requireEnv("OPENAI_API_KEY"),
});

/**
 * Unified OpenAI call for agents
 * - You choose the model HERE
 * - Returns raw text + parsed JSON (if any)
 */
export async function callOpenAI(params: {
  model?: string;
  input: string;
  temperature?: number;
}) {
  const res = await openai.responses.create({
    model: params.model ?? "gpt-4o-mini", // 👈 MODEL SELECTED HERE
    input: params.input,
    temperature: params.temperature ?? 0.2,
  });

  const text = res.output_text?.trim() ?? "";

  return {
    text,
    parsed: safeJson(text),
    raw: res,
  };
}
