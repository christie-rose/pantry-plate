"use client";

import { useState } from "react";
import Link from "next/link";
import { MobileBar, MobileMenu, NavLink, SideRail } from "@/ui";
import { usePathname, useRouter } from "next/navigation";
import {
  RiBookOpenLine,
  RiCalendarLine,
  RiShoppingCartLine,
  RiSettings3Line,
  RiLogoutBoxRLine,
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

  const links = NAV_ITEMS.map((item) => (
    <NavLink
      as={Link}
      key={item.href}
      href={item.href}
      active={isActive(item.href)}
      onClick={() => setMobileMenuOpen(false)}
    >
      <item.Icon size={20} aria-hidden />
      {item.label}
    </NavLink>
  ));
  const footer = (
    <>
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
    </>
  );
  const brand = <Link href="/">A Tavola</Link>;

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <SideRail brand={brand} footer={footer}>
        {links}
      </SideRail>

      <MobileBar brand={brand} open={mobileMenuOpen} onToggle={() => setMobileMenuOpen((o) => !o)} />

      {mobileMenuOpen && (
        <MobileMenu onClose={() => setMobileMenuOpen(false)} footer={footer}>
          {links}
        </MobileMenu>
      )}

      <main className="flex-1">{children}</main>
    </div>
  );
}
