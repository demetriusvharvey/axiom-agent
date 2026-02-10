"use client";

import { useMemo, useState } from "react";
import { threadsMock, Thread } from "@/lib/mock/inbox";

function pill(status: Thread["status"]) {
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

function channelTag(channel: Thread["channel"]) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
      {channel.toUpperCase()}
    </span>
  );
}

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState(threadsMock[0]?.id ?? "");
  const [draft, setDraft] = useState("");

  const selected = useMemo(
    () => threadsMock.find((t) => t.id === selectedId) ?? threadsMock[0],
    [selectedId]
  );

  return (
    <div className="h-[calc(100vh-64px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="mt-1 text-sm text-white/60">
          Review conversations, approve AI drafts, and update lead context.
        </p>
      </div>

      <div className="grid h-[calc(100%-72px)] grid-cols-12 gap-4">
        {/* LEFT: Threads */}
        <section className="col-span-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Threads</div>
              <div className="text-xs text-white/50">{threadsMock.length}</div>
            </div>
          </div>

          <div className="max-h-full overflow-auto">
            {threadsMock.map((t) => {
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
                      {new Date(t.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* MIDDLE: Conversation */}
        <section className="col-span-6 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-white/50">Conversation</div>
                <div className="text-lg font-semibold">{selected?.name}</div>
              </div>
              <div className="flex items-center gap-2">
                {selected ? channelTag(selected.channel) : null}
                {selected ? pill(selected.status) : null}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              {selected?.messages.map((m) => {
                const isCustomer = m.from === "customer";
                const isAI = m.from === "ai";
                return (
                  <div
                    key={m.id}
                    className={[
                      "max-w-[85%] rounded-2xl border px-3 py-2 text-sm",
                      isCustomer
                        ? "ml-0 border-white/10 bg-black"
                        : "ml-auto border-white/10 bg-white/10",
                    ].join(" ")}
                  >
                    <div className="mb-1 text-xs text-white/50">
                      {isCustomer ? "Customer" : isAI ? "AI Draft" : "You"} •{" "}
                      {new Date(m.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-white/90">{m.text}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Reply</div>
              <button
                onClick={() =>
                  setDraft(
                    "Absolutely — I can help. Quick questions: do you need scheduling, payments, and automated confirmations?"
                  )
                }
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                AI Draft
              </button>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a reply or generate an AI draft…"
              className="mt-3 h-28 w-full resize-none rounded-2xl border border-white/10 bg-black p-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
            />

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setDraft("")}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Clear
              </button>
              <button
                onClick={() => alert("Next: wire Approve & Send to API")}
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90"
              >
                Approve & Send
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: Context */}
        <section className="col-span-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 p-4">
            <div className="text-sm text-white/50">Lead Context</div>
            <div className="text-lg font-semibold">{selected?.name}</div>
          </div>

          <div className="space-y-4 p-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-black p-3">
              <div className="text-xs text-white/50">Status</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {selected ? pill(selected.status) : null}
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                  Automation: Assist
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-3">
              <div className="text-xs text-white/50">Active agents</div>
              <div className="mt-2 space-y-2">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                  Lead Qualification Agent • Enabled
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                  Follow-Up Agent • Enabled
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-3">
              <div className="text-xs text-white/50">Quick actions</div>
              <div className="mt-2 flex flex-col gap-2">
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10">
                  Create task
                </button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10">
                  Update stage
                </button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10">
                  View lead
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
