export type Message = {
  id: string;
  from: "customer" | "ai" | "human";
  text: string;
  at: string; // ISO
};

export type Thread = {
  id: string;
  leadId: string;
  name: string;
  channel: "email" | "sms" | "dm";
  status: "unread" | "needs_approval" | "active" | "closed";
  lastText: string;
  updatedAt: string; // ISO
  messages: Message[];
};

export const threadsMock: Thread[] = [
  {
    id: "t1",
    leadId: "lead_001",
    name: "Jordan Miles",
    channel: "email",
    status: "needs_approval",
    lastText: "Can you send pricing for a landing page + booking form?",
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: "m1",
        from: "customer",
        text: "Hey—can you send pricing for a landing page + booking form?",
        at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: "m2",
        from: "ai",
        text: "Draft: Absolutely — I can help with that. Quick questions: do you need payments, calendar scheduling, and email/SMS confirmations?",
        at: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
      },
    ],
  },
  {
    id: "t2",
    leadId: "lead_002",
    name: "Alyssa Green",
    channel: "dm",
    status: "unread",
    lastText: "What nights are you open and do you do VIP tables?",
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    messages: [
      {
        id: "m1",
        from: "customer",
        text: "What nights are you open and do you do VIP tables?",
        at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
  },
  {
    id: "t3",
    leadId: "lead_003",
    name: "Sam Carter",
    channel: "sms",
    status: "active",
    lastText: "Cool, thanks. Let’s talk tomorrow.",
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    messages: [
      {
        id: "m1",
        from: "customer",
        text: "Cool, thanks. Let’s talk tomorrow.",
        at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        id: "m2",
        from: "human",
        text: "Sounds good — what time works best?",
        at: new Date(Date.now() - 1000 * 60 * 175).toISOString(),
      },
    ],
  },
];
