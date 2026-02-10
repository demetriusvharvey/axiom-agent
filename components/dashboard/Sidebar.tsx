"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Inbox", href: "/inbox" },
  { label: "Leads", href: "/leads" },
  { label: "Agents", href: "/agents" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-white/10 bg-black p-4">
      <div className="mb-6">
        <div className="text-sm font-semibold">AXIOM</div>
        <div className="text-xs text-white/50">Operator Console</div>
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-2 text-sm ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
