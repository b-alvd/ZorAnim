"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Dropdown from "@/components/Dropdown/Dropdown";
import styles from "./catalogue.module.css";

const ALL_YEARS = "Toutes les années";
const RATING_OPTIONS = [
  { label: "Toutes les notes", value: "" },
  { label: "4 étoiles et +", value: "4" },
  { label: "3 étoiles et +", value: "3" },
  { label: "2 étoiles et +", value: "2" },
];
export const SORT_OPTIONS = [
  { label: "Ajoutés récemment", value: "" },
  { label: "Mieux notés", value: "note" },
  { label: "Titre (A → Z)", value: "titre" },
  { label: "Année (récente)", value: "annee" },
];
const TYPE_OPTIONS = [
  { label: "Tout", value: "" },
  { label: "Films", value: "films" },
  { label: "Séries", value: "series" },
];

function useSetParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const set = (changes: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };
  return { searchParams, set };
}

// Category pills: the main way to browse the catalogue.
export function CategoryPills({ categories, counts }: { categories: string[]; counts: Record<string, number> }) {
  const { searchParams, set } = useSetParams();
  const current = searchParams.get("category") ?? "";
  return (
    <div className={styles.pills} role="tablist" aria-label="Catégories">
      {["", ...categories].map((cat) => (
        <button
          key={cat || "all"}
          type="button"
          role="tab"
          aria-selected={current === cat}
          className={`${styles.pill} ${current === cat ? styles.pillActive : ""}`}
          onClick={() => set({ category: cat })}
        >
          {cat || "Tout"}
          {cat && <span className={styles.pillCount}>{counts[cat] ?? 0}</span>}
        </button>
      ))}
    </div>
  );
}

export default function Filters({ years }: { years: number[] }) {
  const { searchParams, set } = useSetParams();

  const type = searchParams.get("type") ?? "";
  const year = searchParams.get("year") ?? "";
  const minRating = searchParams.get("minRating") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const hasActiveFilters = type || year || minRating || searchParams.get("category") || searchParams.get("q");

  const labelOf = (options: { label: string; value: string }[], value: string) =>
    options.find((o) => o.value === value)?.label ?? options[0].label;
  const valueOf = (options: { label: string; value: string }[], label: string) =>
    options.find((o) => o.label === label)?.value ?? "";

  return (
    <div className={styles.filters}>
      <div className={styles.segmented}>
        {TYPE_OPTIONS.map((o) => (
          <button
            key={o.label}
            type="button"
            className={`${styles.segment} ${type === o.value ? styles.segmentActive : ""}`}
            onClick={() => set({ type: o.value })}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className={styles.filterField}>
        <Dropdown
          options={[ALL_YEARS, ...years.map(String)]}
          value={year || ALL_YEARS}
          onChange={(v) => set({ year: v === ALL_YEARS ? "" : v })}
        />
      </div>

      <div className={styles.filterField}>
        <Dropdown
          options={RATING_OPTIONS.map((o) => o.label)}
          value={labelOf(RATING_OPTIONS, minRating)}
          onChange={(label) => set({ minRating: valueOf(RATING_OPTIONS, label) })}
        />
      </div>

      <div className={`${styles.filterField} ${styles.sortField}`}>
        <Dropdown
          options={SORT_OPTIONS.map((o) => o.label)}
          value={labelOf(SORT_OPTIONS, sort)}
          onChange={(label) => set({ sort: valueOf(SORT_OPTIONS, label) })}
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          className={styles.filterClear}
          onClick={() => set({ type: "", year: "", minRating: "", category: "", q: "" })}
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
