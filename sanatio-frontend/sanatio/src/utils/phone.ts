const INTERNATIONAL_PREFIX = '+';

function sanitizeDialCode(dialCode?: string): string {
  if (!dialCode) return `${INTERNATIONAL_PREFIX}228`;
  const trimmed = dialCode.trim();
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (!digits) return `${INTERNATIONAL_PREFIX}228`;
  return `${INTERNATIONAL_PREFIX}${digits}`;
}

export function normalizePhone(input: string, dialCode?: string): string {
  if (!input) return input;

  const sanitizedInput = input.trim();
  if (!sanitizedInput) return sanitizeDialCode(dialCode);

  // Si l'utilisateur fournit déjà un numéro international, on le nettoie simplement.
  if (sanitizedInput.startsWith(INTERNATIONAL_PREFIX)) {
    const digits = sanitizedInput.replace(/[^0-9]/g, '');
    return digits ? `${INTERNATIONAL_PREFIX}${digits}` : sanitizeDialCode(dialCode);
  }

  if (sanitizedInput.startsWith('00')) {
    const digits = sanitizedInput.slice(2).replace(/[^0-9]/g, '');
    return digits ? `${INTERNATIONAL_PREFIX}${digits}` : sanitizeDialCode(dialCode);
  }

  const localDigits = sanitizedInput.replace(/[^0-9]/g, '');
  if (!localDigits) return sanitizeDialCode(dialCode);

  const baseCode = sanitizeDialCode(dialCode);
  return `${baseCode}${localDigits}`;
}
