"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Lead = {
  id: string;
  createdAt: string;
  source: string;
  rawMessage: string;
  status: string;
  summary?: string | null;
  priority?: string | null;
  nextStep?: string | null;
  questions?: string[];
  draftReply?: string | null;
};

export default function LeadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setErr(null);
      const res = await fetch(`/api/leads/${id}`);
      const json = await res.json();
      if (!res.ok) return setErr(json?.error ?? "Lead not found");
      setLead(json.lead);
    })();
  }, [id]);

  if (err) {
    return (
      <main style={{ padding: 24 }}>
        <button onClick={() => router.back()}>← Back</button>
        <h2>Lead not found</h2>
        <p style={{ color: "crimson" }}>{err}</p>
      </main>
    );
  }

  if (!lead) return <main style={{ padding: 24 }}>Loading…</main>;

  return (
    <main style={{ padding: 24 }}>
      <button onClick={() => router.back()}>← Back</button>
      <h1>Lead</h1>

      <p><b>ID:</b> {lead.id}</p>
      <p><b>Status:</b> {lead.status}</p>
      <p><b>Priority:</b> {lead.priority ?? "-"}</p>
      <p><b>Source:</b> {lead.source}</p>

      <h3>Summary</h3>
      <p>{lead.summary ?? "(none)"}</p>

      <h3>Raw Message</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>{lead.rawMessage}</pre>

      <h3>Draft Reply</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>{lead.draftReply ?? "(none)"} </pre>
    </main>
  );
}
