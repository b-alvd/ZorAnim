"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Dropdown from "@/components/Dropdown/Dropdown";
import styles from "./catalogue.module.css";

const ALL_CATEGORIES = "Toutes les catégories";
const ALL_YEARS = "Toutes les années";
const RATING_OPTIONS = [
  { label: "Toutes les notes", value: "" },
  { label: "4 étoiles et +", value: "4" },
  { label: "3 étoiles et +", value: "3" },
  { label: "2 étoiles et +", value: "2" },
];

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

  const selectedRatingLabel = RATING_OPTIONS.find((o) => o.value === minRating)?.label ?? RATING_OPTIONS[0].label;

  return (
    <div className={styles.filters}>
      <div className={styles.filterField}>
        <Dropdown
          options={[ALL_CATEGORIES, ...categories]}
          value={category || ALL_CATEGORIES}
          onChange={(v) => setParam("category", v === ALL_CATEGORIES ? "" : v)}
        />
      </div>

      <div className={styles.filterField}>
        <Dropdown
          options={[ALL_YEARS, ...years.map(String)]}
          value={year || ALL_YEARS}
          onChange={(v) => setParam("year", v === ALL_YEARS ? "" : v)}
        />
      </div>

      <div className={styles.filterField}>
        <Dropdown
          options={RATING_OPTIONS.map((o) => o.label)}
          value={selectedRatingLabel}
          onChange={(label) => {
            const found = RATING_OPTIONS.find((o) => o.label === label);
            setParam("minRating", found?.value ?? "");
          }}
        />
      </div>

      {hasActiveFilters && (
        <button type="button" className={styles.filterClear} onClick={clearAll}>
          Réinitialiser
        </button>
      )}
    </div>
  );
}
