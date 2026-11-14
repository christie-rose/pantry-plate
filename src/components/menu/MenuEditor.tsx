"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  RiBold,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiH2,
  RiH3,
  RiItalic,
  RiListOrdered,
  RiListUnordered,
  RiRestaurantLine,
} from "@remixicon/react";
import { ActionsMenu, MenuItem } from "@/ui";
import { RecipePickerModal, type PlanRecipeOption } from "@/components/RecipePickerModal";
import { RecipeBlock } from "@/components/menu/RecipeBlock";
import type { MenuDoc } from "@/lib/menus";

type SaveState = "saved" | "saving" | "error";

export function MenuEditor({
  menu,
  recipes,
}: {
  menu: { id: string; title: string; date: string; content: MenuDoc };
  recipes: PlanRecipeOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(menu.title);
  const [date, setDate] = useState(menu.date);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [showPicker, setShowPicker] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  // The latest values, so a delayed save always sends what's on screen.
  const latest = useRef({ title: menu.title, date: menu.date, content: menu.content as MenuDoc });
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (keepalive = false) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      if (!dirty.current) return;
      dirty.current = false;
      setSaveState("saving");
      try {
        const res = await fetch(`/api/menus/${menu.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: latest.current.title, date: latest.current.date || null, content: latest.current.content }),
          keepalive,
        });
        if (!res.ok) throw new Error();
        setSaveState(dirty.current ? "saving" : "saved");
      } catch {
        dirty.current = true;
        setSaveState("error");
      }
    },
    [menu.id],
  );

  const scheduleSave = useCallback(() => {
    dirty.current = true;
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), 800);
  }, [save]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false, underline: false }),
      Placeholder.configure({ placeholder: "Write your menu here. Use the toolbar to add headings and recipes." }),
      RecipeBlock,
    ],
    content: menu.content,
    editorProps: { attributes: { class: "menu-doc", "aria-label": "Menu" } },
    onUpdate({ editor }) {
      latest.current.content = editor.getJSON() as MenuDoc;
      scheduleSave();
    },
  });

  // Save anything pending when leaving the page.
  useEffect(() => {
    const onHide = () => void save(true);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      void save(true);
    };
  }, [save]);

  function insertRecipe(recipe: PlanRecipeOption) {
    editor
      ?.chain()
      .focus()
      .insertContent([
        { type: "recipe", attrs: { recipeId: recipe.id, title: recipe.title, servings: recipe.servings } },
        { type: "paragraph" },
      ])
      .run();
    setShowPicker(false);
  }

  async function duplicate() {
    setBusy(true);
    await save();
    const res = await fetch(`/api/menus/${menu.id}/duplicate`, { method: "POST" }).catch(() => null);
    if (!res?.ok) return setBusy(false);
    const copy = await res.json();
    router.push(`/menus/${copy.id}`);
  }

  async function remove() {
    setBusy(true);
    dirty.current = false;
    const res = await fetch(`/api/menus/${menu.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setBusy(false);
    router.push("/menus");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Link href="/menus" className="text-sm text-cocoa underline">
          ‹ Menus
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-cocoa" role="status">
            {saveState === "saving" ? "Saving…" : saveState === "error" ? "Couldn't save. Retrying on your next edit." : "Saved"}
          </span>
          <ActionsMenu size="lg" label="Menu actions">
            {(close) =>
              confirmingDelete ? (
                <div className="flex flex-col gap-2 p-1">
                  <p className="text-sm text-ink">Delete “{title || "Untitled menu"}” for good? This can’t be undone.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDelete(false);
                        close();
                      }}
                      className="min-h-[40px] flex-1 rounded-md border border-cocoa/40 px-2 text-sm text-ink"
                    >
                      Keep it
                    </button>
                    <button
                      type="button"
                      onClick={remove}
                      disabled={busy}
                      className="min-h-[40px] flex-1 rounded-md bg-brick px-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {busy ? "Deleting…" : "Yes, delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <MenuItem tone="ink" icon={<RiFileCopyLine size={16} aria-hidden />} onClick={duplicate} disabled={busy}>
                    {busy ? "Duplicating…" : "Duplicate"}
                  </MenuItem>
                  <MenuItem tone="danger" icon={<RiDeleteBinLine size={16} aria-hidden />} onClick={() => setConfirmingDelete(true)}>
                    Delete menu
                  </MenuItem>
                </>
              )
            }
          </ActionsMenu>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            latest.current.title = e.target.value;
            scheduleSave();
          }}
          placeholder="Untitled menu"
          aria-label="Menu title"
          className="w-full border-0 bg-transparent p-0 font-title text-4xl leading-tight text-ink outline-none! ring-0 placeholder:text-cocoa/40"
        />
        <label className="flex items-center gap-2 text-sm text-cocoa">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              latest.current.date = e.target.value;
              scheduleSave();
            }}
            className="min-h-[36px] rounded-md border border-cocoa/30 bg-transparent px-2 text-sm text-ink"
          />
        </label>
      </div>

      <Toolbar editor={editor} onInsertRecipe={() => setShowPicker(true)} />

      <div className="card p-5">
        <EditorContent editor={editor} />
      </div>

      {showPicker && (
        <RecipePickerModal recipes={recipes} onSelect={insertRecipe} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}

function Toolbar({ editor, onInsertRecipe }: { editor: Editor | null; onInsertRecipe: () => void }) {
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      h2: editor?.isActive("heading", { level: 2 }) ?? false,
      h3: editor?.isActive("heading", { level: 3 }) ?? false,
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      bullet: editor?.isActive("bulletList") ?? false,
      ordered: editor?.isActive("orderedList") ?? false,
    }),
  });
  if (!editor) return null;

  const btn = (on: boolean) =>
    `flex h-10 w-10 items-center justify-center rounded-md border ${
      on ? "border-brick bg-paper-alt text-brick" : "border-cocoa/30 text-ink hover:bg-paper-alt"
    }`;
  // mousedown is held back so the editor keeps its selection while a button is pressed.
  const hold = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Formatting">
      <button type="button" onMouseDown={hold} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading" aria-pressed={active?.h2} title="Heading" className={btn(!!active?.h2)}>
        <RiH2 size={18} aria-hidden />
      </button>
      <button type="button" onMouseDown={hold} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Subheading" aria-pressed={active?.h3} title="Subheading" className={btn(!!active?.h3)}>
        <RiH3 size={18} aria-hidden />
      </button>
      <button type="button" onMouseDown={hold} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold" aria-pressed={active?.bold} title="Bold" className={btn(!!active?.bold)}>
        <RiBold size={18} aria-hidden />
      </button>
      <button type="button" onMouseDown={hold} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic" aria-pressed={active?.italic} title="Italic" className={btn(!!active?.italic)}>
        <RiItalic size={18} aria-hidden />
      </button>
      <button type="button" onMouseDown={hold} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bulleted list" aria-pressed={active?.bullet} title="Bulleted list" className={btn(!!active?.bullet)}>
        <RiListUnordered size={18} aria-hidden />
      </button>
      <button type="button" onMouseDown={hold} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered list" aria-pressed={active?.ordered} title="Numbered list" className={btn(!!active?.ordered)}>
        <RiListOrdered size={18} aria-hidden />
      </button>
      <button
        type="button"
        onMouseDown={hold}
        onClick={onInsertRecipe}
        className="ml-auto flex min-h-[40px] items-center gap-2 rounded-md bg-brick px-3 text-sm font-medium text-white"
      >
        <RiRestaurantLine size={18} aria-hidden />
        Insert recipe
      </button>
    </div>
  );
}
