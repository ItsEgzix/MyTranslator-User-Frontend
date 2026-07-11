/**
 * Room QR codes encode the full listener URL (e.g. https://host/r/ABC123).
 * Pull the room code back out of that, falling back to treating the raw
 * text as a bare code if it doesn't look like a URL.
 */
export function extractRoomCode(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/r\/([^/]+)/i);
    if (match) return decodeURIComponent(match[1]).toUpperCase();
    return null;
  } catch {
    // Not a URL — treat as a bare room code if it looks like one.
    return /^[A-Z0-9]{4,8}$/i.test(trimmed) ? trimmed.toUpperCase() : null;
  }
}
