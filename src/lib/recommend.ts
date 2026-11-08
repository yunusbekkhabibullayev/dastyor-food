import type { Product } from "./mock-data";

export type Diet = "vegetarian" | "noSpicy" | "light" | "noMeat";
export type Prefs = { craving: string; diets: Diet[]; budget: number | null };

const meat = [
  "go'sht",
  "tovuq",
  "kotlet",
  "qanot",
  "kolbasa",
  "pepperoni",
  "strips",
  "nagget",
  "file",
  "burger",
];
const has = (p: Product, words: string[]) =>
  words.some((w) => `${p.name} ${p.description}`.toLowerCase().includes(w));

/** Scores menu items locally by craving keywords, diet filters and budget. */
export function recommend(products: Product[], prefs: Prefs, limit = 8): Product[] {
  const words = prefs.craving
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 2);
  return products
    .filter((p) => {
      if (
        (prefs.diets.includes("vegetarian") || prefs.diets.includes("noMeat")) &&
        (has(p, meat) || p.category === "Tovuq")
      )
        return false;
      if (prefs.diets.includes("noSpicy") && has(p, ["achchiq", "spicy", "chili"])) return false;
      if (prefs.diets.includes("light") && ["Kartoshka", "Souslar"].includes(p.category))
        return false;
      if (prefs.budget && p.price > prefs.budget) return false;
      return true;
    })
    .map((p) => {
      const text = `${p.name} ${p.description} ${p.category}`.toLowerCase();
      const score =
        words.reduce((s, w) => s + (text.includes(w) ? 2 : 0), 0) +
        (prefs.diets.includes("light") && p.category === "Ichimliklar" ? 1 : 0);
      return { p, score };
    })
    .filter((x) => words.length === 0 || x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.price - b.p.price)
    .slice(0, limit)
    .map((x) => x.p);
}
