"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Queue", href: "/inbox" },
  { label: "Leads", href: "/leads" },
  { label: "Automation", href: "/agents" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-white/10 bg-black p-4 flex flex-col">
      <div className="mb-8">
        <div className="text-lg font-semibold tracking-wide">AXIOM</div>
        <div className="text-xs text-white/50">AI Lead Department</div>
      </div>

      <nav className="space-y-1 flex-1">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10 text-xs text-white/40">
        AI Status: Active
      </div>
    </aside>
  );
}
