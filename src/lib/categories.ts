export const BASE_CATEGORIES = [
  "Fantastique & Onirique",
  "Science-Fiction",
  "Drame",
  "Comédie",
  "Horreur",
  "Documentaire",
  "Action & Aventure",
  "Musical",
];

export function mergeCategories(existing: string[]): string[] {
  return Array.from(new Set([...BASE_CATEGORIES, ...existing]));
}
