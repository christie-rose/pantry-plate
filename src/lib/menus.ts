import type { Prisma } from "@prisma/client";

/** A menu's body is a rich-text document (Tiptap/ProseMirror JSON). */
export type MenuDoc = { type: "doc"; content?: MenuNode[] };
export type MenuNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: MenuNode[];
  text?: string;
};

export const emptyMenuDoc = (): MenuDoc => ({ type: "doc", content: [{ type: "paragraph" }] });

export function isMenuDoc(value: unknown): value is MenuDoc {
  return typeof value === "object" && value !== null && (value as { type?: unknown }).type === "doc";
}

/** Recipes placed in a menu, in order, found anywhere in the document. */
export function recipeBlocksIn(doc: unknown): { recipeId: string; title: string; servings: number | null }[] {
  const found: { recipeId: string; title: string; servings: number | null }[] = [];
  function walk(node: MenuNode | undefined) {
    if (!node) return;
    if (node.type === "recipe" && typeof node.attrs?.recipeId === "string") {
      found.push({
        recipeId: node.attrs.recipeId,
        title: String(node.attrs.title ?? ""),
        servings: typeof node.attrs.servings === "number" ? node.attrs.servings : null,
      });
    }
    node.content?.forEach(walk);
  }
  if (isMenuDoc(doc)) doc.content?.forEach(walk);
  return found;
}

export const asJson = (doc: MenuDoc): Prisma.InputJsonValue => doc as unknown as Prisma.InputJsonValue;
