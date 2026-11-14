import { prisma } from "@/lib/prisma";
import { MenusClient } from "@/components/menu/MenusClient";
import { recipeBlocksIn } from "@/lib/menus";

export const dynamic = "force-dynamic";

export default async function MenusPage() {
  const menus = await prisma.menu.findMany({ orderBy: [{ date: "desc" }, { updatedAt: "desc" }] });
  return (
    <MenusClient
      initialMenus={menus.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date ? m.date.toISOString().slice(0, 10) : null,
        recipeCount: recipeBlocksIn(m.content).length,
      }))}
    />
  );
}
