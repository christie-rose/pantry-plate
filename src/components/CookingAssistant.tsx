"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RiSendPlaneFill } from "@remixicon/react";
import { AskButton, Button, ChatBubble, ChatSheet, SuggestionCard } from "@/ui";

type Message = { role: "user" | "assistant"; content: string };
type Review = {
  summary: string;
  noteSuggestions: string[];
  changeSuggestions: { title: string; instruction: string }[];
};

const storageKey = (recipeId: string) => `tavola-cooking-chat:${recipeId}`;

function loadMessages(recipeId: string): Message[] {
  try {
    const raw = localStorage.getItem(storageKey(recipeId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(recipeId: string, messages: Message[]) {
  try {
    if (messages.length) localStorage.setItem(storageKey(recipeId), JSON.stringify(messages));
    else localStorage.removeItem(storageKey(recipeId));
  } catch {
    // The chat still works without saving.
  }
}

/**
 * Ask-AI helper for the recipe page. It can answer questions while cooking but never changes the recipe.
 * When the cook is done it offers suggestions (notes to save, changes to review in the editor) for them to accept.
 */
export function CookingAssistant({
  recipeId,
  servings,
  progress,
}: {
  recipeId: string;
  servings: number;
  progress: { ingredients: string[]; steps: number[]; prep: number[] };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "finish">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending, open, mode, review]);

  function openPanel() {
    if (!loaded) {
      setMessages(loadMessages(recipeId));
      setLoaded(true);
    }
    setOpen(true);
  }

  function updateMessages(next: Message[]) {
    setMessages(next);
    saveMessages(recipeId, next);
  }

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setError(null);
    const next: Message[] = [...messages, { role: "user", content: text }];
    updateMessages(next);
    setDraft("");
    setSending(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, servings, progress }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not get an answer just now.");
      updateMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not get an answer just now.");
    } finally {
      setSending(false);
    }
  }

  async function getReview() {
    setError(null);
    setReviewing(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/cooking-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, feedback, servings, progress }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not review the session just now.");
      setReview(data as Review);
      setHandled(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not review the session just now.");
    } finally {
      setReviewing(false);
    }
  }

  async function addToNotes(text: string, key: string) {
    setError(null);
    const res = await fetch(`/api/recipes/${recipeId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch(() => null);
    if (res?.ok) {
      setHandled((prev) => new Set(prev).add(key));
      router.refresh();
    } else {
      setError("The note could not be saved. Try again.");
    }
  }

  function dismiss(key: string) {
    setHandled((prev) => new Set(prev).add(key));
  }

  function reviewInEditor(instruction: string) {
    router.push(`/recipes/${recipeId}/edit?aiEdit=${encodeURIComponent(instruction)}`);
  }

  function startOver() {
    updateMessages([]);
    setReview(null);
    setFeedback("");
    setMode("chat");
    setError(null);
  }

  if (!open) return <AskButton onClick={openPanel} />;

  const suggestions = review
    ? [
        ...review.noteSuggestions.map((text, i) => ({ kind: "note" as const, key: `n${i}`, text })),
        ...review.changeSuggestions.map((c, i) => ({ kind: "change" as const, key: `c${i}`, title: c.title, text: c.instruction })),
      ]
    : [];
  const openSuggestions = suggestions.filter((s) => !handled.has(s.key));

  return (
    <ChatSheet
      title={mode === "chat" ? "Ask about this recipe" : "All done?"}
      onClose={() => setOpen(false)}
      headerAction={
        mode === "chat" ? (
          <Button variant="secondary" compact onClick={() => setMode("finish")}>
            I’m done cooking
          </Button>
        ) : (
          <Button variant="secondary" compact onClick={() => setMode("chat")}>
            Back to chat
          </Button>
        )
      }
      footer={
        mode === "chat" ? (
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              aria-label="Your question"
              placeholder="Ask anything while you cook…"
              className="min-h-[56px] flex-1 resize-none rounded-md border border-cocoa/40 bg-white px-3 py-2 text-sm text-ink"
            />
            <Button onClick={send} disabled={sending || !draft.trim()} aria-label="Send">
              <RiSendPlaneFill size={18} aria-hidden />
            </Button>
          </div>
        ) : undefined
      }
    >
      {mode === "chat" ? (
        <>
          {messages.length === 0 && (
            <p className="text-sm text-cocoa">
              Ask about substitutions, timing, what to do next or how to fix something. I know this recipe and which
              steps you have done. I won’t change the recipe. When you finish, I can suggest notes or changes to save.
            </p>
          )}
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role}>
              {m.content}
            </ChatBubble>
          ))}
          {sending && <ChatBubble role="assistant">Thinking…</ChatBubble>}
          {error && <p className="text-sm text-brick">{error}</p>}
          <div ref={endRef} />
        </>
      ) : (
        <>
          {!review ? (
            <>
              <p className="text-sm text-cocoa">
                Tell me how it turned out, or skip this. I’ll look at your questions and suggest notes to save or
                changes to try next time. Nothing is saved unless you choose it.
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                aria-label="How did it turn out?"
                placeholder="For example: a bit too salty, and it needed 10 more minutes in the oven."
                className="min-h-[104px] w-full resize-y rounded-md border border-cocoa/40 bg-white px-3 py-2 text-sm text-ink"
              />
              <div>
                <Button onClick={getReview} disabled={reviewing || (!feedback.trim() && messages.length === 0)}>
                  {reviewing ? "Looking it over…" : "Get suggestions"}
                </Button>
              </div>
              {messages.length === 0 && !feedback.trim() && (
                <p className="text-xs text-cocoa">Ask a question or write a note first so there is something to go on.</p>
              )}
            </>
          ) : (
            <>
              {review.summary && <p className="text-sm text-ink">{review.summary}</p>}
              {suggestions.length === 0 && <p className="text-sm text-cocoa">Nothing needs saving from this one.</p>}
              {suggestions.length > 0 && openSuggestions.length === 0 && (
                <p className="text-sm text-cocoa">All handled. Your notes are saved on the recipe.</p>
              )}
              {openSuggestions.map((s) =>
                s.kind === "note" ? (
                  <SuggestionCard
                    key={s.key}
                    title="Note for next time"
                    actions={
                      <>
                        <Button variant="secondary" compact onClick={() => addToNotes(s.text, s.key)}>
                          Add to notes
                        </Button>
                        <Button variant="secondary" compact onClick={() => dismiss(s.key)}>
                          Dismiss
                        </Button>
                      </>
                    }
                  >
                    {s.text}
                  </SuggestionCard>
                ) : (
                  <SuggestionCard
                    key={s.key}
                    title={s.title}
                    actions={
                      <>
                        <Button variant="secondary" compact onClick={() => reviewInEditor(s.text)}>
                          Review in editor
                        </Button>
                        <Button variant="secondary" compact onClick={() => dismiss(s.key)}>
                          Dismiss
                        </Button>
                      </>
                    }
                  >
                    {s.text}
                  </SuggestionCard>
                ),
              )}
              {error && <p className="text-sm text-brick">{error}</p>}
              <div>
                <Button variant="secondary" onClick={startOver}>
                  Clear this conversation
                </Button>
              </div>
            </>
          )}
          {!review && error && <p className="text-sm text-brick">{error}</p>}
          <div ref={endRef} />
        </>
      )}
    </ChatSheet>
  );
}
