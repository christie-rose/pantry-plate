import { prisma } from "@/lib/prisma";
import { MenusClient } from "@/components/menu/MenusClient";
import { dayString, recipeBlocksIn } from "@/lib/menus";

export const dynamic = "force-dynamic";

export default async function MenusPage() {
  const menus = await prisma.menu.findMany({ orderBy: [{ startDate: "desc" }, { updatedAt: "desc" }] });
  return (
    <MenusClient
      initialMenus={menus.map((m) => ({
        id: m.id,
        title: m.title,
        startDate: dayString(m.startDate),
        endDate: dayString(m.endDate),
        recipeCount: recipeBlocksIn(m.content).length,
      }))}
    />
  );
}
