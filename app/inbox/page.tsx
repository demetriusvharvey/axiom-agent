"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  createdAt: string;
  source: string;
  status: string;
  priority: string | null;
  summary: string | null;
  rawMessage: string;
};

export default function InboxPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const res = await fetch("/api/leads", { cache: "no-store" });
    const json = await res.json();
    setLeads(json.leads ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter((l) =>
      (l.summary ?? "").toLowerCase().includes(s) ||
      (l.rawMessage ?? "").toLowerCase().includes(s) ||
      (l.priority ?? "").toLowerCase().includes(s) ||
      (l.status ?? "").toLowerCase().includes(s)
    );
  }, [leads, q]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Lead Inbox</h1>
          <p style={{ marginTop: 6, opacity: 0.8 }}>SQLite-backed. Click a lead to open details.</p>
        </div>
        <button
          onClick={load}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search summary / message / status / priority…"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {filtered.map((l) => (
          <a
            key={l.id}
            href={`/lead/${l.id}`}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 14,
              padding: 14,
              textDecoration: "none",
              color: "inherit",
              background: "white",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong style={{ lineHeight: 1.2 }}>
                {(l.summary ?? l.rawMessage ?? "Lead").slice(0, 90)}
              </strong>
              <span style={{ whiteSpace: "nowrap", opacity: 0.85 }}>
                {l.priority ?? "—"} • {l.status}
              </span>
            </div>
            <div style={{ marginTop: 8, opacity: 0.75, fontSize: 13 }}>
              {new Date(l.createdAt).toLocaleString()} • {l.source} • {l.id}
            </div>
          </a>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: 16, border: "1px dashed #ccc", borderRadius: 12, opacity: 0.8 }}>
            No leads yet. Submit one via <code>/api/ingest</code> and refresh.
          </div>
        )}
      </div>
    </main>
  );
}
