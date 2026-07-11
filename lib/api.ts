export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const WS_URL = API_URL.replace(/^http/, "ws");

export type LanguageMode = "ALL" | "LIST" | "LOCKED";

export interface PublicRoom {
  code: string;
  name: string;
  languageMode: LanguageMode;
  defaultLanguage: string;
  // The exact set of language codes this listener may choose.
  languages: string[];
}

export async function getRoom(code: string): Promise<PublicRoom> {
  const res = await fetch(`${API_URL}/rooms/${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error("Room not found");
  return res.json();
}
