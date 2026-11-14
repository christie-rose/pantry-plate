"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { RiSmartphoneLine } from "@remixicon/react";
import { Modal } from "@/ui";

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

const noopSubscribe = () => () => {};

/** True when the app is already open from the home screen (installed), so the link isn't needed. */
function useInstalled(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true,
    () => true, // hidden until the browser has been asked, so it doesn't flash on load
  );
}

function usePlatform(): "ios" | "android" | "other" {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      const ua = navigator.userAgent;
      if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
      if (/Android/.test(ua)) return "android";
      return "other";
    },
    () => "other",
  );
}

/** A small link that installs the app to the home screen, or explains how to when the browser can't do it directly. */
export function AddToHomeScreen() {
  const installed = useInstalled();
  const platform = usePlatform();
  const [showHelp, setShowHelp] = useState(false);
  const promptEvent = useRef<InstallPromptEvent | null>(null);

  // Chrome and Edge hand over an install prompt we can open from our own link.
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      promptEvent.current = e as InstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;

  async function handleClick() {
    const event = promptEvent.current;
    if (event) {
      promptEvent.current = null;
      await event.prompt().catch(() => {});
      return;
    }
    setShowHelp(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex min-h-[44px] items-center gap-2 text-sm text-cocoa underline"
      >
        <RiSmartphoneLine size={18} aria-hidden />
        Add to Home Screen
      </button>

      {showHelp && (
        <Modal title="Add to Home Screen" onClose={() => setShowHelp(false)}>
          {platform === "ios" ? (
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-ink">
              <li>Open this page in Safari.</li>
              <li>Tap the Share button (the square with an arrow pointing up).</li>
              <li>Scroll down and tap “Add to Home Screen”.</li>
              <li>Tap “Add”.</li>
            </ol>
          ) : platform === "android" ? (
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-ink">
              <li>Tap the menu (⋮) in your browser.</li>
              <li>Tap “Add to Home screen” or “Install app”.</li>
              <li>Confirm.</li>
            </ol>
          ) : (
            <p className="text-sm text-ink">
              On a computer, look for the install icon at the right end of the address bar in Chrome or Edge. On a phone,
              open this page in Safari (iPhone) or Chrome (Android) and use its Share or menu button to add it to your
              Home Screen.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
