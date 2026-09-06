"use client";

import { useMemo, useRef, useState } from "react";
import { RiCameraLine, RiUpload2Line } from "@remixicon/react";
import { STORES, type Store } from "@/lib/pantry";
import { formatDateOnly, isInMonth, monthKeyFor } from "@/lib/budget";

type Expense = {
  id: string;
  date: string;
  amount: number;
  store: string;
  note: string | null;
};

type Budget = { id: string; monthlyBudget: number };

function todayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BudgetClient({ budget, initialExpenses }: { budget: Budget; initialExpenses: Expense[] }) {
  const [monthlyBudget, setMonthlyBudget] = useState(budget.monthlyBudget);
  const [budgetInput, setBudgetInput] = useState(String(budget.monthlyBudget));
  const [savingBudget, setSavingBudget] = useState(false);
  const [expenses, setExpenses] = useState(initialExpenses);

  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [draftTotal, setDraftTotal] = useState("");
  const [draftStore, setDraftStore] = useState<Store>("Costco");
  const [draftDate, setDraftDate] = useState(todayIsoDate());
  const [draftNote, setDraftNote] = useState("");
  const [logging, setLogging] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const currentMonthKey = monthKeyFor(new Date());
  const monthExpenses = useMemo(
    () => expenses.filter((e) => isInMonth(new Date(e.date), currentMonthKey)),
    [expenses, currentMonthKey],
  );
  const runningTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = monthlyBudget - runningTotal;
  const pct = monthlyBudget > 0 ? Math.min(100, (runningTotal / monthlyBudget) * 100) : 0;

  async function saveBudgetTarget() {
    const value = Number(budgetInput);
    if (!Number.isFinite(value) || value < 0) return;
    setSavingBudget(true);
    const res = await fetch("/api/budget", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyBudget: value }),
    });
    setSavingBudget(false);
    if (res.ok) setMonthlyBudget(value);
  }

  async function handleReceiptFileSelected(file: File) {
    setReading(true);
    setReadError(null);

    const reader = new FileReader();
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const [, base64] = dataUrl.split(",");
    const mediaType = file.type || "image/jpeg";

    const res = await fetch("/api/expenses/parse-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, mediaType }),
    });

    setReading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setReadError(data.error ?? "Could not read that receipt");
      return;
    }

    const parsed = await res.json();
    setDraftTotal(String(parsed.total));
    const receiptStore = (parsed.store ?? "").toLowerCase();
    const matchedStore = STORES.find((s) => receiptStore.includes(s.toLowerCase()));
    if (matchedStore) setDraftStore(matchedStore);
  }

  async function handleLogExpense() {
    const amount = Number(draftTotal);
    if (!Number.isFinite(amount) || amount <= 0) return;

    setLogging(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: draftDate, amount, store: draftStore, note: draftNote || null }),
    });
    setLogging(false);

    if (res.ok) {
      const expense = await res.json();
      setExpenses((prev) => [{ ...expense, date: expense.date }, ...prev]);
      setDraftTotal("");
      setDraftNote("");
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 pb-24">
      <h1 className="text-3xl text-brick">Budget</h1>

      <div className="card flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-cocoa">Monthly budget</label>
          <input
            type="number"
            min={0}
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            className="min-h-[44px] w-28 rounded-md border border-cocoa/40 bg-white px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={saveBudgetTarget}
            disabled={savingBudget}
            className="min-h-[44px] rounded-md bg-sage px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-paper-alt">
          <div
            className={`h-full ${pct >= 100 ? "bg-brick" : "bg-sage"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-sm text-ink">
          ${runningTotal.toFixed(2)} spent of ${monthlyBudget.toFixed(2)} this month
          {remaining >= 0 ? (
            <span className="text-cocoa"> — ${remaining.toFixed(2)} remaining</span>
          ) : (
            <span className="text-brick"> — ${Math.abs(remaining).toFixed(2)} over</span>
          )}
        </p>
      </div>

      <div className="card flex flex-col gap-3 p-4">
        <h2 className="text-xl text-ink">Log a purchase</h2>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="min-h-[44px] flex items-center gap-2 rounded-md border border-cocoa/40 px-3 py-2 text-sm"
          >
            <RiCameraLine size={18} aria-hidden />
            Snap a receipt
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleReceiptFileSelected(file);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="min-h-[44px] flex items-center gap-2 rounded-md border border-cocoa/40 px-3 py-2 text-sm"
          >
            <RiUpload2Line size={18} aria-hidden />
            Upload a receipt
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleReceiptFileSelected(file);
              e.target.value = "";
            }}
          />
        </div>
        {reading && <p className="text-sm text-cocoa">Reading receipt…</p>}
        {readError && <p className="text-sm text-brick">{readError}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            value={draftTotal}
            onChange={(e) => setDraftTotal(e.target.value)}
            placeholder="Total"
            className="min-h-[44px] w-28 rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm"
          />
          <select
            value={draftStore}
            onChange={(e) => setDraftStore(e.target.value as Store)}
            className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm"
          >
            {STORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm"
          />
          <input
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Note (optional)"
            className="min-h-[44px] flex-1 min-w-[120px] rounded-md border border-cocoa/40 bg-white px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleLogExpense}
            disabled={logging || !draftTotal || Number(draftTotal) <= 0}
            className="min-h-[44px] rounded-md bg-brick px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Confirm &amp; log
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl text-brick">This month&apos;s purchases</h2>
        {monthExpenses.length === 0 && <p className="text-sm text-cocoa">No purchases logged yet this month.</p>}
        <ul className="flex flex-col divide-y divide-cocoa/20 rounded-md border border-cocoa/30 bg-white">
          {monthExpenses.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium text-ink">
                  ${expense.amount.toFixed(2)} · {expense.store}
                </p>
                <p className="text-xs text-cocoa">
                  {formatDateOnly(expense.date)}
                  {expense.note ? ` · ${expense.note}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(expense.id)}
                className="min-h-[44px] rounded-md border border-brick/50 px-3 py-1 text-xs text-brick"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
