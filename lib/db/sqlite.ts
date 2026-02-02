import Database from "better-sqlite3";
import path from "path";

export type LeadRow = {
  id: string;
  createdAt: string;
  source: string;
  rawMessage: string;
  status: string;
  summary: string | null;
  priority: string | null;
  nextStep: string | null;
  questions: any[];
  draftReply: string | null;
  aiLog: Record<string, any>;
};

const dbPath = path.join(process.cwd(), "data.sqlite");
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  createdAt TEXT NOT NULL,
  source TEXT NOT NULL,
  rawMessage TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT,
  priority TEXT,
  nextStep TEXT,
  questions TEXT,
  draftReply TEXT,
  aiLog TEXT
);
`);

function safeParse<T>(value: any, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function upsertLead(lead: LeadRow) {
  const stmt = db.prepare(`
    INSERT INTO leads (id, createdAt, source, rawMessage, status, summary, priority, nextStep, questions, draftReply, aiLog)
    VALUES (@id, @createdAt, @source, @rawMessage, @status, @summary, @priority, @nextStep, @questions, @draftReply, @aiLog)
    ON CONFLICT(id) DO UPDATE SET
      createdAt=excluded.createdAt,
      source=excluded.source,
      rawMessage=excluded.rawMessage,
      status=excluded.status,
      summary=excluded.summary,
      priority=excluded.priority,
      nextStep=excluded.nextStep,
      questions=excluded.questions,
      draftReply=excluded.draftReply,
      aiLog=excluded.aiLog
  `);

  stmt.run({
    ...lead,
    questions: JSON.stringify(lead.questions ?? []),
    aiLog: JSON.stringify(lead.aiLog ?? {}),
  });

  return lead;
}

export function getLead(id: string): LeadRow | null {
  const row: any = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(id);
  if (!row) return null;

  return {
    ...row,
    questions: safeParse(row.questions, []),
    aiLog: safeParse(row.aiLog, {}),
  };
}

export function listLeads(limit = 100): LeadRow[] {
  const rows: any[] = db.prepare(`SELECT * FROM leads ORDER BY createdAt DESC LIMIT ?`).all(limit);
  return rows.map((r: any) => ({
    ...r,
    questions: safeParse(r.questions, []),
    aiLog: safeParse(r.aiLog, {}),
  }));
}

export function updateLead(id: string, patch: Partial<LeadRow>) {
  const cur = getLead(id);
  if (!cur) return null;
  const next = { ...cur, ...patch } as LeadRow;
  upsertLead(next);
  return next;
}
