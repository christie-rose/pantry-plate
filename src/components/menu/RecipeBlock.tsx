"use client";

import { useState } from "react";
import Link from "next/link";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { RiAddLine, RiCloseLine, RiSubtractLine } from "@remixicon/react";

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
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/recipes/${recipeId}${servings ? `?servings=${servings}` : ""}`}
          className="text-base font-medium text-ink underline"
        >
          {title}
        </Link>
        {editable && (
          <button
            type="button"
            onClick={() => deleteNode()}
            aria-label={`Remove ${title} from this menu`}
            title="Remove from menu"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-cocoa hover:bg-cocoa/10"
          >
            <RiCloseLine size={16} aria-hidden />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-cocoa">
        {servings != null && (
          <span className="flex items-center gap-1">
            {editable && (
              <button
                type="button"
                onClick={() => updateAttributes({ servings: Math.max(1, servings - 1) })}
                aria-label="Fewer servings"
                className="flex h-6 w-6 items-center justify-center rounded-md border border-cocoa/40 text-ink"
              >
                <RiSubtractLine size={14} aria-hidden />
              </button>
            )}
            <span>Serves {servings}</span>
            {editable && (
              <button
                type="button"
                onClick={() => updateAttributes({ servings: servings + 1 })}
                aria-label="More servings"
                className="flex h-6 w-6 items-center justify-center rounded-md border border-cocoa/40 text-ink"
              >
                <RiAddLine size={14} aria-hidden />
              </button>
            )}
          </span>
        )}
        <button
          type="button"
          onClick={addToGrocery}
          disabled={adding}
          className="rounded-md border border-cocoa/40 bg-white px-2 py-1 text-ink disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add to grocery list"}
        </button>
        {status && <span role="status">{status}</span>}
      </div>
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
