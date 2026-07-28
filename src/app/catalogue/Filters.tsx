"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./catalogue.module.css";

export default function Filters({ categories, years }: { categories: string[]; years: number[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? "";
  const year = searchParams.get("year") ?? "";
  const minRating = searchParams.get("minRating") ?? "";

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const hasActiveFilters = category || year || minRating;

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("year");
    params.delete("minRating");
    params.delete("page");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className={styles.filters}>
      <select className={styles.filterSelect} value={category} onChange={(e) => setParam("category", e.target.value)}>
        <option value="">Toutes les catégories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select className={styles.filterSelect} value={year} onChange={(e) => setParam("year", e.target.value)}>
        <option value="">Toutes les années</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select className={styles.filterSelect} value={minRating} onChange={(e) => setParam("minRating", e.target.value)}>
        <option value="">Toutes les notes</option>
        <option value="4">4 étoiles et +</option>
        <option value="3">3 étoiles et +</option>
        <option value="2">2 étoiles et +</option>
      </select>

      {hasActiveFilters && (
        <button type="button" className={styles.filterClear} onClick={clearAll}>
          Réinitialiser
        </button>
      )}
    </div>
  );
}
