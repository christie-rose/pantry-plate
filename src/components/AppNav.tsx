"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  RiFridgeLine,
  RiBookOpenLine,
  RiCalendarLine,
  RiShoppingCartLine,
  RiWalletLine,
  RiSettings3Line,
  RiLogoutBoxRLine,
} from "@remixicon/react";

const NAV_ITEMS = [
  { href: "/pantry", label: "Pantry", Icon: RiFridgeLine },
  { href: "/recipes", label: "Recipes", Icon: RiBookOpenLine },
  { href: "/plan", label: "Plan", Icon: RiCalendarLine },
  { href: "/grocery", label: "Grocery", Icon: RiShoppingCartLine },
  { href: "/budget", label: "Budget", Icon: RiWalletLine },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      {/* Desktop side rail */}
      <nav className="hidden w-56 shrink-0 flex-col border-r border-cocoa/20 bg-white md:sticky md:top-0 md:flex md:h-screen">
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <Link href="/" className="mb-4 text-xl text-brick">
            Pantry & Plate
          </Link>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm ${
                isActive(item.href) ? "bg-paper-alt font-medium text-brick" : "text-ink"
              }`}
            >
              <item.Icon size={20} aria-hidden />
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 flex-col gap-1 border-t border-cocoa/20 bg-white p-4 pt-2">
          <Link
            href="/dietary"
            className={`flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm ${
              isActive("/dietary") ? "bg-paper-alt font-medium text-brick" : "text-ink"
            }`}
          >
            <RiSettings3Line size={20} aria-hidden />
            Household settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[44px] items-center gap-3 rounded-md px-3 text-left text-sm text-cocoa"
          >
            <RiLogoutBoxRLine size={20} aria-hidden />
            Log out
          </button>
        </div>
      </nav>

      {/* Mobile top bar: title + settings + logout */}
      <header className="flex min-h-[56px] items-center justify-between border-b border-cocoa/20 bg-white px-4 md:hidden">
        <Link href="/" className="text-lg text-brick">
          Pantry & Plate
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/dietary"
            aria-label="Household settings"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink"
          >
            <RiSettings3Line size={22} aria-hidden />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="flex h-11 w-11 items-center justify-center rounded-full text-cocoa"
          >
            <RiLogoutBoxRLine size={22} aria-hidden />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-cocoa/20 bg-white md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
              isActive(item.href) ? "text-brick" : "text-cocoa"
            }`}
          >
            <item.Icon size={22} aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
