"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { getRoom, PublicRoom } from "@/lib/api";
import { languageLabel } from "@/lib/languages";
import { Listener, ListenerEvent } from "@/lib/listener";
import { SearchableSelect } from "@/components/searchable-select";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAutoScroll } from "@/lib/use-auto-scroll";

// The transcript is a sequence of spoken lines with divider markers inserted
// whenever the listener switches language (old text is kept above the divider).
type Entry = { kind: "divider"; label: string } | { kind: "line"; text: string };

export default function ListenPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);

  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [language, setLanguage] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [connState, setConnState] = useState<"connecting" | "open" | "closed">(
    "connecting",
  );
  const [audioOn, setAudioOn] = useState(false);
  const [volume, setVolume] = useState(1);
  const [entries, setEntries] = useState<Entry[]>([]);

  const listenerRef = useRef<Listener | null>(null);
  const audioOnRef = useRef(false);
  const volumeRef = useRef(1);
  const prevLangRef = useRef<string | null>(null);
  const { containerRef, atBottom, handleScroll, scrollToBottom } =
    useAutoScroll<HTMLDivElement>([entries]);

  function handleEvent(e: ListenerEvent) {
    switch (e.type) {
      case "status":
        setLive(e.live);
        break;
      case "language":
        setLanguage((cur) => (cur === e.language ? cur : e.language));
        break;
      case "connection":
        setConnState(e.state);
        break;
      case "transcript.delta":
        setLive(true);
        setEntries((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.kind === "line") {
            next[next.length - 1] = { kind: "line", text: last.text + e.text };
          } else {
            next.push({ kind: "line", text: e.text });
          }
          return next;
        });
        break;
      case "transcript.done":
        setEntries((prev) => {
          const last = prev[prev.length - 1];
          // Start a new paragraph only if the current line has content.
          if (last && last.kind === "line" && last.text.trim()) {
            return [...prev, { kind: "line", text: "" }];
          }
          return prev;
        });
        break;
    }
  }

  // Load room + pick the default language.
  useEffect(() => {
    getRoom(code)
      .then((r) => {
        setRoom(r);
        setLanguage(r.defaultLanguage);
      })
      .catch(() => setNotFound(true));
  }, [code]);

  // (Re)connect whenever the chosen language changes.
  useEffect(() => {
    if (!language) return;

    // On a real language switch, keep the old text and drop in a divider so
    // the new language starts on a fresh line below.
    const prev = prevLangRef.current;
    if (prev && prev !== language) {
      setEntries((cur) =>
        cur.length === 0
          ? cur
          : [
              ...cur,
              { kind: "divider", label: languageLabel(language) },
              { kind: "line", text: "" },
            ],
      );
    }
    prevLangRef.current = language;

    const listener = new Listener(code, language, handleEvent);
    listenerRef.current = listener;
    listener.connect();
    // Preserve audio + volume across a language switch.
    if (audioOnRef.current) {
      listener.enableAudio().then(() => listener.setVolume(volumeRef.current));
    }
    return () => listener.disconnect();
  }, [code, language]);

  async function toggleAudio() {
    const listener = listenerRef.current;
    if (!listener) return;
    if (!audioOn) {
      await listener.enableAudio();
      listener.setVolume(volume);
      audioOnRef.current = true;
      setAudioOn(true);
    } else {
      listener.setMuted(true);
      audioOnRef.current = false;
      setAudioOn(false);
    }
  }

  function changeVolume(v: number) {
    setVolume(v);
    volumeRef.current = v;
    listenerRef.current?.setVolume(v);
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background text-center text-foreground">
        <p className="text-lg">Room “{code}” was not found.</p>
        <Link href="/" className="text-accent underline">
          Try another code
        </Link>
      </div>
    );
  }

  const visible = entries.filter(
    (e) => e.kind === "divider" || e.text.trim().length > 0,
  );
  let lastLineIndex = -1;
  for (let i = visible.length - 1; i >= 0; i--) {
    if (visible[i].kind === "line") {
      lastLineIndex = i;
      break;
    }
  }
  const canChoose = (room?.languages.length ?? 0) > 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" aria-label="Back" className="text-muted hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-semibold leading-tight">
              {room?.name ?? "Loading…"}
            </h1>
            <p className="truncate text-xs text-muted">Room {code}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {canChoose && language && (
            <SearchableSelect
              value={language}
              onChange={setLanguage}
              aria-label="Translation language"
              placeholder="Search languages…"
              options={room!.languages.map((c) => ({
                value: c,
                label: languageLabel(c),
              }))}
              className="w-40"
            />
          )}
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                live ? "animate-pulse bg-emerald-500" : "bg-subtle"
              }`}
            />
            <span className="hidden text-muted sm:inline">
              {connState !== "open"
                ? "Reconnecting…"
                : live
                  ? "Live"
                  : "Waiting"}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <main
          ref={containerRef}
          onScroll={handleScroll}
          className="mx-auto h-full w-full max-w-2xl overflow-y-auto px-6 py-8"
        >
          {lastLineIndex === -1 ? (
            <div className="flex h-full items-center justify-center text-center text-subtle">
              {live
                ? "Listening…"
                : "The translation will appear here as soon as the host starts speaking."}
            </div>
          ) : (
            <div className="space-y-4 text-2xl leading-relaxed">
              {visible.map((entry, i) =>
                entry.kind === "divider" ? (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-1 text-xs font-medium uppercase tracking-wide text-muted"
                  >
                    <span className="h-px flex-1 bg-border" />
                    {entry.label}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                ) : (
                  <p
                    key={i}
                    className={i === lastLineIndex ? "text-foreground" : "text-muted"}
                  >
                    {entry.text}
                  </p>
                ),
              )}
            </div>
          )}
        </main>

        {!atBottom && (
          <button
            onClick={() => scrollToBottom()}
            aria-label="Jump to latest"
            title="Jump to latest"
            className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent-hover"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}
      </div>

      <footer className="border-t border-border bg-surface px-6 py-4">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-4">
          <button
            onClick={toggleAudio}
            className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 font-medium ${
              audioOn
                ? "bg-emerald-500 text-black hover:bg-emerald-400"
                : "bg-accent text-accent-foreground hover:bg-accent-hover"
            }`}
          >
            {audioOn ? (
              <>
                <Volume2 className="h-4 w-4" /> Audio on
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" /> Tap to hear audio
              </>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            disabled={!audioOn}
            className="flex-1 accent-accent disabled:opacity-40"
            aria-label="Volume"
          />
        </div>
        <p className="mx-auto mt-2 w-full max-w-2xl text-center text-xs text-subtle">
          Audio starts muted — tap the button to allow playback on your device.
        </p>
      </footer>
    </div>
  );
}
