"use client";

import { useRef, useState } from "react";

type SpeechRecognitionResultLike = {
  transcript: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [index: number]: { [index: number]: SpeechRecognitionResultLike } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type WindowWithSpeech = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export function VoiceButton({ onTranscript }: { onTranscript: (transcript: string) => void }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function handleClick() {
    const w = window as WindowWithSpeech;
    const SpeechRecognitionCtor = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  if (!supported) {
    return <span className="text-xs text-cocoa">Voice input not supported in this browser</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-cocoa/40 text-lg ${
        listening ? "bg-brick text-white" : "bg-white text-cocoa"
      }`}
    >
      {listening ? "●" : "🎤"}
    </button>
  );
}
