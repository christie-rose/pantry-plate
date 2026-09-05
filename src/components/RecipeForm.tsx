"use client";

export type RecipeFormState = {
  title: string;
  tags: string;
  servings: string;
  notes: string;
  instructions: string[];
  ingredients: { name: string; amount: string; unit: string }[];
};

export const emptyRecipeForm: RecipeFormState = {
  title: "",
  tags: "",
  servings: "4",
  notes: "",
  instructions: [""],
  ingredients: [{ name: "", amount: "", unit: "" }],
};

export function recipeFormToInput(form: RecipeFormState) {
  return {
    title: form.title.trim(),
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    servings: Number(form.servings),
    notes: form.notes.trim() || null,
    instructions: form.instructions.map((s) => s.trim()).filter(Boolean),
    ingredients: form.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        amount: i.amount.trim() ? Number(i.amount) : null,
        unit: i.unit.trim() || null,
      })),
  };
}

export function RecipeForm({
  value,
  onChange,
}: {
  value: RecipeFormState;
  onChange: (next: RecipeFormState) => void;
}) {
  function updateInstruction(index: number, text: string) {
    const next = [...value.instructions];
    next[index] = text;
    onChange({ ...value, instructions: next });
  }

  function updateIngredient(index: number, field: "name" | "amount" | "unit", text: string) {
    const next = value.ingredients.map((ing, i) => (i === index ? { ...ing, [field]: text } : ing));
    onChange({ ...value, ingredients: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-cocoa">Title</label>
        <input
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          className="rounded-md border border-cocoa/40 bg-white px-3 py-2 text-ink"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm text-cocoa">Servings</label>
          <input
            type="number"
            min={1}
            value={value.servings}
            onChange={(e) => onChange({ ...value, servings: e.target.value })}
            className="rounded-md border border-cocoa/40 bg-white px-3 py-2 text-ink"
          />
        </div>
        <div className="flex flex-[2] flex-col gap-1">
          <label className="text-sm text-cocoa">Tags (comma separated)</label>
          <input
            value={value.tags}
            onChange={(e) => onChange({ ...value, tags: e.target.value })}
            placeholder="weeknight, chicken, quick"
            className="rounded-md border border-cocoa/40 bg-white px-3 py-2 text-ink"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-cocoa">Ingredients</label>
        {value.ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={ingredient.name}
              onChange={(e) => updateIngredient(index, "name", e.target.value)}
              placeholder="Ingredient name"
              className="flex-[2] rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm text-ink"
            />
            <input
              value={ingredient.amount}
              onChange={(e) => updateIngredient(index, "amount", e.target.value)}
              placeholder="Amount"
              className="w-20 rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm text-ink"
            />
            <input
              value={ingredient.unit}
              onChange={(e) => updateIngredient(index, "unit", e.target.value)}
              placeholder="Unit"
              className="w-20 rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm text-ink"
            />
            <button
              type="button"
              onClick={() => onChange({ ...value, ingredients: value.ingredients.filter((_, i) => i !== index) })}
              className="rounded-md border border-brick/50 px-2 text-xs text-brick"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...value, ingredients: [...value.ingredients, { name: "", amount: "", unit: "" }] })}
          className="self-start text-sm text-sage underline"
        >
          + Add ingredient
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-cocoa">Instructions</label>
        {value.instructions.map((step, index) => (
          <div key={index} className="flex gap-2">
            <span className="pt-2 text-sm text-cocoa">{index + 1}.</span>
            <textarea
              value={step}
              onChange={(e) => updateInstruction(index, e.target.value)}
              rows={2}
              className="flex-1 rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm text-ink"
            />
            <button
              type="button"
              onClick={() => onChange({ ...value, instructions: value.instructions.filter((_, i) => i !== index) })}
              className="self-start rounded-md border border-brick/50 px-2 py-1 text-xs text-brick"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...value, instructions: [...value.instructions, ""] })}
          className="self-start text-sm text-sage underline"
        >
          + Add step
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-cocoa">Notes</label>
        <textarea
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          rows={2}
          className="rounded-md border border-cocoa/40 bg-white px-3 py-2 text-ink"
        />
      </div>
    </div>
  );
}
