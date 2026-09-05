"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-sm p-8 flex flex-col gap-4"
      >
        <h1 className="text-2xl text-brick">Pantry & Plate</h1>
        <p className="text-sm text-cocoa">Enter the household password to continue.</p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="min-h-[44px] rounded-md border border-cocoa/40 bg-white px-3 py-2 text-ink outline-none focus:border-brick"
        />

        {error && <p className="text-sm text-brick">{error}</p>}

        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="min-h-[44px] rounded-md bg-brick px-4 py-2 text-white font-medium disabled:opacity-50"
        >
          {submitting ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
