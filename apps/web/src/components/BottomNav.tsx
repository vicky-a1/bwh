"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const NAV: NavItem[] = [
  { href: "/learn", label: "Learn" },
  { href: "/dashboard", label: "Fly" },
  { href: "/devices", label: "Devices" },
  { href: "/community", label: "Community" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/10 bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-3 py-2">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex-1 rounded-2xl px-2 py-2 text-center text-xs font-semibold transition",
                active ? "bg-white text-slate-950" : "text-slate-200 hover:bg-white/10",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
