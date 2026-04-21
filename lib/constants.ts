import type { ProductSection, Weekday } from "./types";

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Gio",
  5: "Ven",
  6: "Sab",
  7: "Dom",
};

export const WEEKDAY_FULL_LABELS: Record<Weekday, string> = {
  1: "Lunedì",
  2: "Martedì",
  3: "Mercoledì",
  4: "Giovedì",
  5: "Venerdì",
  6: "Sabato",
  7: "Domenica",
};

export const PRODUCT_SECTIONS: ProductSection[] = [
  "Dolci",
  "Pane comune",
  "Salati",
  "Pizze farcite",
  "Focacce farcite",
  "Specialità",
];

export const SECTION_COLORS: Record<ProductSection, string> = {
  "Dolci": "bg-amber-100 text-amber-800",
  "Pane comune": "bg-orange-100 text-orange-800",
  "Salati": "bg-red-100 text-red-800",
  "Pizze farcite": "bg-rose-100 text-rose-800",
  "Focacce farcite": "bg-pink-100 text-pink-800",
  "Specialità": "bg-emerald-100 text-emerald-800",
};

export const STATUS_COLORS = {
  pending: "bg-slate-50 text-slate-700",
  partial: "bg-red-100 text-red-700",
  done: "bg-emerald-100 text-emerald-800",
  selected: "bg-slate-900 text-white",
};
