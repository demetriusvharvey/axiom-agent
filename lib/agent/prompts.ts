export const ANALYZE_SYSTEM = `
You are Axiom's Business Ops Intake Coordinator.
Extract and classify the lead. Output must be VALID JSON ONLY.
No markdown. No commentary.
`;

export function analyzeUserPrompt(rawMessage: string) {
  return `
Lead message:
---
${rawMessage}
---

Return JSON with this exact shape:
{
  "name": "",
  "email": "",
  "company": "",
  "service_type": "web_dev | ai_automation | content | support | other",
  "priority": "P1|P2|P3|P4",
  "summary": "",
  "budget_estimate": "",
  "timeline": "",
  "missing_info": [],
  "recommended_next_steps": [],
  "risk_flags": []
}
`.trim();
}

export const DRAFT_SYSTEM = `
You write concise, professional replies for Axiom.
Rules:
- Do NOT promise pricing.
- Ask at most 2-4 clarifying questions if needed.
- End with one clear CTA to schedule a call or reply with details.
- Tone: confident, helpful, modern.
`;

export function draftUserPrompt(input: {
  name?: string; company?: string; email?: string;
  serviceType?: string; summary?: string; missingInfo?: string[];
}) {
  const missing = (input.missingInfo ?? []).map(x => `- ${x}`).join("\n");
  return `
Write an email reply to this lead.

Known details:
- Name: ${input.name ?? "Not provided"}
- Company: ${input.company ?? "Not provided"}
- Email: ${input.email ?? "Not provided"}
- Service type: ${input.serviceType ?? "Not provided"}
- Summary: ${input.summary ?? "Not provided"}

Missing info (ask for these if relevant):
${missing || "- None"}

Sign-off as: Demetrius (Axiom)
`.trim();
}
