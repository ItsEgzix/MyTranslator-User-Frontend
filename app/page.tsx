"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Modal } from "@/components/modal";
import { QrScanner } from "@/components/qr-scanner";
import { QrUpload } from "@/components/qr-upload";
import { extractRoomCode } from "@/lib/qr-decode";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function join(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) router.push(`/r/${c}`);
  }

  function handleDetected(text: string) {
    const roomCode = extractRoomCode(text);
    if (roomCode) {
      router.push(`/r/${roomCode}`);
    } else {
      setScanning(false);
      setError("That QR code doesn't look like a room code.");
    }
  }

  return (
    <div className="relative flex flex-1 items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-semibold text-foreground">MyTranslator</h1>
        <p className="mt-2 text-muted">
          Enter the room code from your host to hear the live English
          translation.
        </p>

        <form onSubmit={join} className="mt-8 space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            maxLength={8}
            autoFocus
            className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-foreground placeholder-subtle outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Join room
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-subtle">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setScanning(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 font-medium text-foreground/80 hover:bg-surface-hover"
          >
            <QrCode className="h-4 w-4" />
            Scan a QR code
          </button>

          <QrUpload onDetect={handleDetected} />
        </div>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </div>

      {scanning && (
        <Modal title="Scan room QR code" onClose={() => setScanning(false)}>
          <QrScanner onDetect={handleDetected} />
        </Modal>
      )}
    </div>
  );
}
