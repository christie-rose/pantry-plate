import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MenuEditor } from "@/components/menu/MenuEditor";
import { dayString, emptyMenuDoc, isMenuDoc } from "@/lib/menus";

export const dynamic = "force-dynamic";

export default async function MenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [menu, recipes] = await Promise.all([
    prisma.menu.findUnique({ where: { id } }),
    prisma.recipe.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        servings: true,
        categories: true,
        cuisine: true,
        ingredients: { select: { name: true } },
      },
    }),
  ]);
  if (!menu) notFound();

  return (
    <MenuEditor
      key={menu.id}
      menu={{
        id: menu.id,
        title: menu.title,
        startDate: dayString(menu.startDate),
        endDate: dayString(menu.endDate),
        content: isMenuDoc(menu.content) ? menu.content : emptyMenuDoc(),
      }}
      recipes={recipes}
    />
  );
}
