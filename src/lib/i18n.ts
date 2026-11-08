import { useProfileSettings } from "./profile-settings";
import { dictA } from "./i18n-dict-a";
import { dictB } from "./i18n-dict-b";
import { dictCore } from "./i18n-dict-core";

export type Lang = "uz" | "ru" | "en";
export const LANGS: { id: Lang; label: string }[] = [
  { id: "uz", label: "O'zbekcha" },
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
];

/** Keys are the original Uzbek Latin strings; `{name}` placeholders are interpolated. */
export type Dict = Record<string, { ru: string; en: string }>;
const dict: Dict = { ...dictCore, ...dictA, ...dictB };

export function translate(lang: Lang, s: string, vars?: Record<string, string | number>): string {
  let out = lang === "uz" ? s : (dict[s]?.[lang] ?? s);
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

export function useT() {
  const { language } = useProfileSettings();
  return (s: string, vars?: Record<string, string | number>) => translate(language, s, vars);
}
