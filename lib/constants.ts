import type { Weekday } from "./types";

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

// Static colors for the default sections (kept for backward compat)
export const SECTION_COLORS: Record<string, string> = {
  "Dolci": "bg-amber-100 text-amber-800",
  "Pane comune": "bg-orange-100 text-orange-800",
  "Salati": "bg-red-100 text-red-800",
  "Pizze farcite": "bg-rose-100 text-rose-800",
  "Focacce farcite": "bg-pink-100 text-pink-800",
  "Specialità": "bg-emerald-100 text-emerald-800",
};

// Returns color for any section name, falling back to slate for unknowns
export function getSectionColor(name: string): string {
  return SECTION_COLORS[name] ?? "bg-slate-100 text-slate-700";
}

// Color palette cycled for new sections
export const SECTION_COLOR_PALETTE: string[] = [
  "bg-amber-100 text-amber-800",
  "bg-orange-100 text-orange-800",
  "bg-red-100 text-red-800",
  "bg-rose-100 text-rose-800",
  "bg-pink-100 text-pink-800",
  "bg-emerald-100 text-emerald-800",
  "bg-blue-100 text-blue-800",
  "bg-violet-100 text-violet-800",
  "bg-teal-100 text-teal-800",
  "bg-cyan-100 text-cyan-800",
];

export const STATUS_COLORS = {
  pending: "bg-slate-50 text-slate-700",
  partial: "bg-red-100 text-red-700",
  done: "bg-emerald-100 text-emerald-800",
  selected: "bg-slate-900 text-white",
};
