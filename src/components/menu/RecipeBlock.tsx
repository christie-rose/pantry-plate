"use client";

import { useState } from "react";
import Link from "next/link";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { RiAddLine, RiCloseLine, RiDraggable, RiShoppingCartLine, RiSubtractLine } from "@remixicon/react";

/** A recipe placed in a menu: shows its name (linking to the recipe), servings, and a grocery list button. */
function RecipeBlockView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const { recipeId, title, servings } = node.attrs as { recipeId: string; title: string; servings: number | null };
  const [status, setStatus] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const editable = editor.isEditable;

  async function addToGrocery() {
    setAdding(true);
    setStatus(null);
    try {
      const res = await fetch("/api/grocery/add-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, servings: servings ?? undefined }),
      });
      if (!res.ok) throw new Error();
      setStatus("Added to grocery list");
    } catch {
      setStatus("Couldn't add to grocery list");
    }
    setAdding(false);
    setTimeout(() => setStatus(null), 4000);
  }

  return (
    <NodeViewWrapper className="menu-recipe" contentEditable={false}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {editable && (
          <span
            data-drag-handle
            draggable
            aria-label="Drag to move"
            title="Drag to move"
            className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center text-cocoa active:cursor-grabbing"
          >
            <RiDraggable size={16} aria-hidden />
          </span>
        )}
        <Link
          href={`/recipes/${recipeId}${servings ? `?servings=${servings}` : ""}`}
          className="min-w-0 flex-1 basis-40 text-sm font-medium text-ink underline"
        >
          {title}
        </Link>
        <div className="ml-auto flex items-center gap-1 text-xs text-cocoa">
          {servings != null && (
            <>
              {editable && (
                <button
                  type="button"
                  onClick={() => updateAttributes({ servings: Math.max(1, servings - 1) })}
                  aria-label="Fewer servings"
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-cocoa/40 text-ink"
                >
                  <RiSubtractLine size={12} aria-hidden />
                </button>
              )}
              <span className="px-1">Serves {servings}</span>
              {editable && (
                <button
                  type="button"
                  onClick={() => updateAttributes({ servings: servings + 1 })}
                  aria-label="More servings"
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-cocoa/40 text-ink"
                >
                  <RiAddLine size={12} aria-hidden />
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={addToGrocery}
            disabled={adding}
            aria-label="Add to grocery list"
            title="Add to grocery list"
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-md border border-cocoa/40 bg-white text-ink disabled:opacity-50"
          >
            <RiShoppingCartLine size={14} aria-hidden />
          </button>
          {editable && (
            <button
              type="button"
              onClick={() => deleteNode()}
              aria-label={`Remove ${title} from this menu`}
              title="Remove from menu"
              className="flex h-7 w-7 items-center justify-center rounded-md text-cocoa hover:bg-cocoa/10"
            >
              <RiCloseLine size={16} aria-hidden />
            </button>
          )}
        </div>
      </div>
      {status && (
        <p role="status" className="mt-1 pl-7 text-xs text-cocoa">
          {status}
        </p>
      )}
    </NodeViewWrapper>
  );
}

export const RecipeBlock = Node.create({
  name: "recipe",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      recipeId: { default: "" },
      title: { default: "" },
      servings: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-recipe-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-recipe-block": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RecipeBlockView);
  },
});
