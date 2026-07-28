const DIACRITICS_REGEX = new RegExp("[̀-ͯ]", "g");

export function normalize(text: string): string {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

export function matchesQuery(query: string, ...fields: string[]): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return fields.some((field) => normalize(field).includes(q));
}
