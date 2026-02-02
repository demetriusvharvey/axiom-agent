import { Lead } from "@/types/lead";

const store = new Map<string, Lead>();

export function dbUpsertLead(lead: Lead) {
  store.set(lead.id, lead);
}

export function dbGetLead(id: string) {
  return store.get(id);
}

export function dbListLeads() {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
