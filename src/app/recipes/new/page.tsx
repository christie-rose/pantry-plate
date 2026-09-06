"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { RecipeForm, emptyRecipeForm, recipeFormToInput, type RecipeFormState } from "@/components/RecipeForm";
import { IngredientMatchPanel } from "@/components/IngredientMatchPanel";
import type { RecipeSource } from "@/lib/recipes";

type SavedRecipe = {
  id: string;
  ingredients: { id: string; name: string; reviewed: boolean }[];
};

export default function NewRecipePage() {
  const [form, setForm] = useState<RecipeFormState>(emptyRecipeForm);
  const [source, setSource] = useState<RecipeSource>("manual");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [respectDietary, setRespectDietary] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SavedRecipe | null>(null);
  const [pantryItems, setPantryItems] = useState<{ id: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function applyParsed(parsed: {
    title?: string;
    servings?: number;
    notes?: string | null;
    ingredients?: { name: string; amount: number | null; unit: string | null }[];
    instructions?: string[];
  }) {
    setForm({
      title: parsed.title ?? "",
      tags: "",
      servings: String(parsed.servings ?? 4),
      notes: parsed.notes ?? "",
      instructions: parsed.instructions?.length ? parsed.instructions : [""],
      ingredients: parsed.ingredients?.length
        ? parsed.ingredients.map((i) => ({
            name: i.name,
            amount: i.amount != null ? String(i.amount) : "",
            unit: i.unit ?? "",
          }))
        : [{ name: "", amount: "", unit: "" }],
    });
  }

  async function handlePhotoSelected(file: File) {
    setImporting(true);
    setImportError(null);

    const reader = new FileReader();
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const [, base64] = dataUrl.split(",");
    const mediaType = file.type || "image/jpeg";

    const res = await fetch("/api/recipes/parse-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, mediaType }),
    });

    setImporting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setImportError(data.error ?? "Could not read that photo");
      return;
    }

    const parsed = await res.json();
    applyParsed(parsed);
    setSource("photo");
    setSourceUrl(null);
  }

  async function handleLinkImport() {
    if (!linkInput.trim()) return;
    setImporting(true);
    setImportError(null);

    const res = await fetch("/api/recipes/parse-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: linkInput.trim() }),
    });

    setImporting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setImportError(data.error ?? "Could not find a recipe at that link");
      return;
    }

    const parsed = await res.json();
    applyParsed(parsed);
    setSource("link");
    setSourceUrl(linkInput.trim());
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setImporting(true);
    setImportError(null);

    const res = await fetch("/api/recipes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: aiPrompt.trim(), respectDietary }),
    });

    setImporting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setImportError(data.error ?? "Could not generate a recipe");
      return;
    }

    const parsed = await res.json();
    applyParsed(parsed);
    setSource("ai");
    setSourceUrl(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...recipeFormToInput(form), source, sourceUrl }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveError(data.error ?? "Failed to save recipe");
      return;
    }

    const recipe: SavedRecipe = await res.json();
    setSaved(recipe);

    const pantryRes = await fetch("/api/pantry");
    setPantryItems(await pantryRes.json());
  }

  if (saved) {
    const unmatched = saved.ingredients.filter((i) => !i.reviewed);
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
        <h1 className="text-3xl text-brick">Recipe saved</h1>
        {unmatched.length > 0 && (
          <IngredientMatchPanel
            ingredients={unmatched}
            pantryItems={pantryItems}
            onResolved={() =>
              setSaved((s) => (s ? { ...s, ingredients: s.ingredients.map((i) => ({ ...i, reviewed: true })) } : s))
            }
          />
        )}
        <div className="flex gap-3">
          <Link
            href={`/recipes/${saved.id}`}
            className="min-h-[44px] flex items-center rounded-md bg-brick px-4 text-sm font-medium text-white"
          >
            View recipe
          </Link>
          <Link
            href="/recipes"
            className="min-h-[44px] flex items-center rounded-md border border-cocoa/40 px-4 text-sm"
          >
            Back to recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <h1 className="text-3xl text-brick">Add recipe</h1>

      <div className="card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] rounded-md border border-cocoa/40 px-3 py-2 text-sm"
          >
            📷 Photo of a recipe
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoSelected(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex gap-2">
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Paste a recipe link…"
            className="min-h-[44px] flex-1 rounded-md border border-cocoa/40 bg-white px-3 py-2 text-sm text-ink"
          />
          <button
            type="button"
            onClick={handleLinkImport}
            disabled={importing || !linkInput.trim()}
            className="min-h-[44px] rounded-md border border-cocoa/40 px-3 py-2 text-sm disabled:opacity-50"
          >
            Import
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-cocoa/20 pt-3">
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="✨ Generate with AI — e.g. quick vegetarian pasta"
            className="min-h-[44px] flex-1 rounded-md border border-cocoa/40 bg-white px-3 py-2 text-sm text-ink"
          />
          <label className="flex items-center gap-1 text-xs text-cocoa">
            <input
              type="checkbox"
              checked={respectDietary}
              onChange={(e) => setRespectDietary(e.target.checked)}
            />
            Respect household restrictions
          </label>
          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={importing || !aiPrompt.trim()}
            className="min-h-[44px] rounded-md border border-cocoa/40 px-3 py-2 text-sm disabled:opacity-50"
          >
            Generate
          </button>
        </div>

        {importing && <p className="text-sm text-cocoa">Reading recipe…</p>}
        {importError && <p className="text-sm text-brick">{importError}</p>}
      </div>

      <RecipeForm value={form} onChange={setForm} />

      {saveError && <p className="text-sm text-brick">{saveError}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !form.title.trim()}
        className="min-h-[44px] self-start rounded-md bg-brick px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Save recipe
      </button>
    </div>
  );
}
