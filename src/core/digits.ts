// Arabic-Indic, Extended Arabic-Indic (Persian), Devanagari and full-width zeros.
const ZEROS = [0x0660, 0x06f0, 0x0966, 0xff10];

export function normalizeDigits(text: string): string {
  let out = '';
  for (const char of text) {
    const code = char.charCodeAt(0);
    const zero = ZEROS.find((start) => code >= start && code <= start + 9);
    out += zero === undefined ? char : String(code - zero);
  }
  return out;
}
