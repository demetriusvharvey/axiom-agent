"use client";

import { useEffect, useMemo, useState } from "react";

/** ---------- Types coming from your API ---------- */
type ThreadListItem = {
  id: string;
  leadId: string;
  name: string;
  channel: "email" | "sms" | "dm";
  status: "unread" | "needs_approval" | "active" | "closed";
  lastText: string;
  updatedAt: string;
};

type MessageRow = {
  id: string;
  threadId: string;
  from: "customer" | "ai" | "human";
  text: string;
  at: string;
};

type ActivityRow = {
  id: string;
  threadId: string;
  type: string;
  detail: string | null;
  outcome: "ok" | "pending" | "blocked" | null;
  at: string;
};

type ThreadDetailResponse = {
  ok: boolean;
  thread: {
    id: string;
    leadId: string;
    channel: "email" | "sms" | "dm";
    status: "unread" | "needs_approval" | "active" | "closed";
    lastText: string | null;
    updatedAt: string;
  };
  lead: any;
  messages: MessageRow[];
  // ✅ API may return "activities" (plural). Older UI expected "activity".
  activities?: ActivityRow[];
  activity?: ActivityRow[];
};

/** ---------- UI helpers ---------- */
function pill(status: ThreadListItem["status"]) {
  const label =
    status === "needs_approval"
      ? "Needs approval"
      : status === "unread"
      ? "Unread"
      : status === "active"
      ? "Active"
      : "Closed";

  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
      {label}
    </span>
  );
}

function channelTag(channel: ThreadListItem["channel"]) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
      {channel.toUpperCase()}
    </span>
  );
}

function outcomeBadge(o?: "ok" | "pending" | "blocked" | null) {
  const label =
    o === "ok"
      ? "OK"
      : o === "pending"
      ? "Pending"
      : o === "blocked"
      ? "Blocked"
      : "";
  return label ? (
    <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70">
      {label}
    </span>
  ) : null;
}

function timeHM(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripDraftPrefix(text: string) {
  return text.startsWith("Draft: ") ? text.slice("Draft: ".length) : text;
}

/** ---------- Page ---------- */
export default function InboxPage() {
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<string>("");

  const [detail, setDetail] = useState<ThreadDetailResponse | null>(null);
  const [isSending, setIsSending] = useState(false);

  const selected = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? threads[0],
    [threads, selectedId]
  );

  const opsEvents: ActivityRow[] =
    (detail?.activities as ActivityRow[]) ??
    (detail?.activity as ActivityRow[]) ??
    [];

  // 1) Load thread list
  async function loadThreads(preserveSelection = true) {
    const res = await fetch("/api/threads", { cache: "no-store" });
    const json = await res.json();
    const list: ThreadListItem[] = Array.isArray(json?.threads)
      ? json.threads
      : [];

    setThreads(list);

    // pick first if none selected OR selected vanished
    if (!preserveSelection) {
      if (list[0]?.id) setSelectedId(list[0].id);
      return;
    }

    if (!selectedId && list[0]?.id) {
      setSelectedId(list[0].id);
      return;
    }

    if (selectedId && list.length && !list.some((t) => t.id === selectedId)) {
      setSelectedId(list[0].id);
    }
  }

  // 2) Load selected thread detail
  async function loadDetail(threadId: string) {
    const res = await fetch(`/api/threads/${threadId}`, { cache: "no-store" });
    const json: ThreadDetailResponse = await res.json();
    if (json?.ok) setDetail(json);
    else setDetail(null);
  }

  useEffect(() => {
    loadThreads(true).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected?.id) return;
    loadDetail(selected.id).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  async function approveAndSend() {
    if (!selected?.id) return;
    const text = draft.trim();
    if (!text) return;

    setIsSending(true);

    // Optimistic UI: clear draft immediately
    setDraft("");

    try {
      // ✅ real endpoint
      const res = await fetch(`/api/threads/${selected.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setDraft(text); // restore on failure
        alert(json?.error ?? "Approve failed");
        return;
      }

      // refresh list + detail so UI reflects DB truth
      await Promise.all([loadThreads(true), loadDetail(selected.id)]);
    } finally {
      setIsSending(false);
    }
  }

  function proposeAction() {
    // If there is an AI draft message, use the most recent one as the proposal
    const msgs = detail?.messages ?? [];
    const lastAi = [...msgs].reverse().find((m) => m.from === "ai");
    if (lastAi?.text) {
      setDraft(stripDraftPrefix(lastAi.text));
      return;
    }

    // fallback
    setDraft(
      "Absolutely — I can help. Quick questions: do you need scheduling, payments, and automated confirmations?"
    );
  }

  return (
    <div className="h-[calc(100vh-64px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Queue</h1>
        <p className="mt-1 text-sm text-white/60">
          Leads that require review or action.
        </p>
      </div>

      <div className="grid h-[calc(100%-72px)] grid-cols-12 gap-4">
        {/* LEFT: Conversations */}
        <section className="col-span-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Conversations</div>
              <div className="text-xs text-white/50">{threads.length}</div>
            </div>
            <div className="mt-2 text-xs text-white/40">
              Search coming next…
            </div>
          </div>

          <div className="max-h-full overflow-auto">
            {threads.map((t) => {
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={[
                    "w-full border-b border-white/10 p-3 text-left transition",
                    active ? "bg-white/10" : "hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{t.name}</div>
                    <div className="flex items-center gap-2">
                      {channelTag(t.channel)}
                    </div>
                  </div>

                  <div className="mt-1 line-clamp-2 text-xs text-white/60">
                    {t.lastText}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    {pill(t.status)}
                    <span className="text-xs text-white/40">
                      {timeHM(t.updatedAt)}
                    </span>
                  </div>
                </button>
              );
            })}

            {threads.length === 0 ? (
              <div className="p-4 text-sm text-white/50">
                No conversations yet. Hit{" "}
                <code className="text-white/80">/api/ingest</code> to create one.
              </div>
            ) : null}
          </div>
        </section>

        {/* MIDDLE: Conversation + composer */}
        <section className="col-span-6 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-white/50">Conversation</div>
                <div className="text-lg font-semibold">
                  {selected?.name ?? "—"}
                </div>
                <div className="mt-2 text-sm text-white/70">
                  {selected?.lastText ? `Last: ${selected.lastText}` : "—"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selected ? channelTag(selected.channel) : null}
                {selected ? pill(selected.status) : null}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              {(detail?.messages ?? []).map((m) => {
                const isCustomer = m.from === "customer";
                const isAI = m.from === "ai";

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      // ✅ click AI draft to populate composer
                      if (m.from === "ai") setDraft(stripDraftPrefix(m.text));
                    }}
                    className="block w-full text-left"
                  >
                    <div
                      className={[
                        "max-w-[85%] rounded-2xl border px-3 py-2 text-sm",
                        isCustomer
                          ? "ml-0 border-white/10 bg-black"
                          : "ml-auto border-white/10 bg-white/10",
                        m.from === "ai" ? "cursor-pointer" : "",
                      ].join(" ")}
                    >
                      <div className="mb-1 text-xs text-white/50">
                        {isCustomer
                          ? "Customer"
                          : isAI
                          ? "AI Draft (click to use)"
                          : "Human"}{" "}
                        • {timeHM(m.at)}
                      </div>
                      <div className="text-white/90">{m.text}</div>
                    </div>
                  </button>
                );
              })}

              {detail?.messages?.length ? (
                <div className="pt-2 text-center text-xs text-white/35">
                  AI is monitoring this lead for follow-ups and escalation.
                </div>
              ) : (
                <div className="text-sm text-white/50">
                  Select a conversation.
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-white/10 bg-black/40 p-4 backdrop-blur supports-[backdrop-filter]:bg-black/30">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Reply</div>

              <button
                onClick={proposeAction}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Use AI Draft
              </button>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a reply…"
              className="mt-3 h-28 w-full resize-none rounded-2xl border border-white/10 bg-black p-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
            />

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setDraft("")}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                disabled={isSending}
              >
                Clear
              </button>
              <button
                onClick={approveAndSend}
                disabled={isSending}
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Approve & Send"}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: Ops Feed (real DB) */}
        <section className="col-span-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 p-4">
            <div className="text-sm text-white/50">Ops Feed</div>
            <div className="text-lg font-semibold">{selected?.name ?? "—"}</div>
          </div>

          <div className="max-h-full overflow-auto p-4">
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <div className="text-xs text-white/50">Mode</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                    Assist
                  </span>
                  {selected ? pill(selected.status) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/50">Events</div>
                  <div className="text-xs text-white/40">Last 24h</div>
                </div>

                <div className="mt-2 space-y-2">
                  {opsEvents.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-white/80">
                          {String(a.type).replaceAll("_", " ")}
                        </div>
                        <div className="text-white/40">{timeHM(a.at)}</div>
                      </div>
                      <div className="mt-1 text-white/60">
                        {a.detail ?? ""}
                        {outcomeBadge(a.outcome)}
                      </div>
                    </div>
                  ))}

                  {opsEvents.length === 0 && (
                    <div className="text-xs text-white/50">
                      No ops events yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-3">
                <div className="text-xs text-white/50">Actions</div>
                <div className="mt-2 flex flex-col gap-2">
                  <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10">
                    Escalate to human
                  </button>
                </div>
              </div>

              <div className="h-2" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
