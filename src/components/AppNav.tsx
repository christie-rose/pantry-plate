"use client";

import { useState } from "react";
import Link from "next/link";
import { NavLink } from "@/ui";
import { usePathname, useRouter } from "next/navigation";
import {
  RiBookOpenLine,
  RiCalendarLine,
  RiShoppingCartLine,
  RiSettings3Line,
  RiLogoutBoxRLine,
  RiMenuLine,
  RiCloseLine,
} from "@remixicon/react";

const NAV_ITEMS = [
  { href: "/recipes", label: "Recipes", Icon: RiBookOpenLine },
  { href: "/grocery", label: "Grocery List", Icon: RiShoppingCartLine },
  { href: "/plan", label: "Meal Plan", Icon: RiCalendarLine },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            A Tavola
          </Link>
          {NAV_ITEMS.map((item) => (
            <NavLink as={Link} key={item.href} href={item.href} active={isActive(item.href)}>
              <item.Icon size={20} aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="flex shrink-0 flex-col gap-1 border-t border-cocoa/20 bg-white p-4 pt-2">
          <NavLink as={Link} href="/dietary" active={isActive("/dietary")}>
            <RiSettings3Line size={20} aria-hidden />
            Household settings
          </NavLink>
          <NavLink as="button" muted onClick={handleLogout}>
            <RiLogoutBoxRLine size={20} aria-hidden />
            Log out
          </NavLink>
        </div>
      </nav>

      {/* Mobile top bar: title + hamburger */}
      <header className="sticky top-0 z-30 flex min-h-[56px] items-center justify-between border-b border-cocoa/20 bg-white px-4 md:hidden">
        <Link href="/" className="text-lg text-brick">
          A Tavola
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink"
        >
          {mobileMenuOpen ? <RiCloseLine size={24} aria-hidden /> : <RiMenuLine size={24} aria-hidden />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-20 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute inset-x-0 top-[56px] flex flex-col gap-1 border-b border-cocoa/20 bg-white p-4 shadow-lg">
            {NAV_ITEMS.map((item) => (
              <NavLink as={Link} key={item.href} href={item.href} active={isActive(item.href)} onClick={() => setMobileMenuOpen(false)}>
                <item.Icon size={20} aria-hidden />
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-1 border-t border-cocoa/20 pt-2">
              <NavLink as={Link} href="/dietary" active={isActive("/dietary")} onClick={() => setMobileMenuOpen(false)}>
                <RiSettings3Line size={20} aria-hidden />
                Household settings
              </NavLink>
              <NavLink
                as="button"
                muted
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <RiLogoutBoxRLine size={20} aria-hidden />
                Log out
              </NavLink>
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1">{children}</main>
    </div>
  );
}
