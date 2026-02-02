import { Lead } from "@/types/lead";

const store = new Map<string, Lead>();

export function dbUpsertLead(lead: Lead) {
  store.set(lead.id, lead);
  return lead;
}

export function dbGetLead(id: string) {
  return store.get(id) ?? null;
}

export function dbListLeads() {
  return Array.from(store.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
