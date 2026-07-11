// Keep in sync with backend/src/realtime/languages.ts
// The 13 output languages the model can speak (listener choices come from here).
export const OUTPUT_LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "fr", label: "French" },
  { code: "it", label: "Italian" },
  { code: "de", label: "German" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "hi", label: "Hindi" },
  { code: "id", label: "Indonesian" },
  { code: "vi", label: "Vietnamese" },
];

export function languageLabel(code: string): string {
  return OUTPUT_LANGUAGES.find((l) => l.code === code)?.label ?? code;
}
