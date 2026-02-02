import crypto from "crypto";

export function newId() {
  return crypto.randomUUID();
}

export function safeJson<T = any>(text: string): T | null {
  try { return JSON.parse(text) as T; } catch { return null; }
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}
