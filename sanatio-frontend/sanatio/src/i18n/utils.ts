import type { TFunction } from 'i18next';
import type { i18n } from 'i18next';

/**
 * Attempt to translate a message key coming from the backend. If the key is not found,
 * fall back to the original message.
 */
export function translateMaybeKey(message: string | null | undefined, t: TFunction, i18next: i18n): string {
  if (!message) return '';
  const candidates: string[] = [];
  const trimmed = message.trim();
  if (!trimmed) return '';
  if (trimmed.includes(':')) candidates.push(trimmed);
  const dottedMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\.(.+)$/);
  if (dottedMatch) {
    const [, ns, rest] = dottedMatch;
    candidates.push(`${ns}:${rest}`);
  }
  candidates.push(trimmed);

  for (const key of candidates) {
    const translated = t(key);
    if (translated && translated !== key) {
      return translated;
    }
  }
  return trimmed;
}
