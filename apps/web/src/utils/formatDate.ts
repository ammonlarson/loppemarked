const LOCALE_MAP: Record<string, string> = { da: "da-DK", en: "en-GB" };

export function formatDate(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] ?? "da-DK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string, lang: string): string {
  return new Date(iso).toLocaleString(LOCALE_MAP[lang] ?? "da-DK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
