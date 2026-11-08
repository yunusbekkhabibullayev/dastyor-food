import { useEffect } from "react";
import { useProfileSettings } from "@/lib/profile-settings";
import { translate, type Lang } from "@/lib/i18n";

/** Translates rendered Uzbek text nodes and attributes into the chosen language (client only). */
const patterns: [RegExp, Record<"ru" | "en", string>][] = [
  [/^(\d+) ta xona$/, { ru: "$1 заведений", en: "$1 places" }],
  [/^(\d+) daqiqa$/, { ru: "$1 мин", en: "$1 min" }],
  [/^([\d-]+) daq$/, { ru: "$1 мин", en: "$1 min" }],
  [/^(.+) savatga qo'shildi$/, { ru: "$1 добавлен в корзину", en: "$1 added to cart" }],
  [/^(.+) menyusidan qidirish\.\.\.$/, { ru: "Поиск в меню $1...", en: "Search $1 menu..." }],
  [/^(\d+) ta$/, { ru: "$1 шт", en: "$1 pcs" }],
];
const ATTRS = ["placeholder", "aria-label", "title"];
const orig = new WeakMap<Node, string>();
const origAttr = new WeakMap<Element, Record<string, string>>();

function tr(lang: Lang, s: string): string {
  const key = s.trim();
  if (!key || lang === "uz") return s;
  let out = translate(lang, key);
  if (out === key)
    for (const [re, t] of patterns)
      if (re.test(key)) {
        out = key.replace(re, t[lang]);
        break;
      }
  return out === key ? s : s.replace(key, out);
}

function apply(root: Node, lang: Lang) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null = root;
  while (n) {
    if (n.nodeType === 3) {
      const cur = n.nodeValue ?? "";
      const prevOut = orig.has(n) ? tr(lang, orig.get(n)!) : null;
      if (prevOut === null || cur !== prevOut) orig.set(n, cur);
      const next = tr(lang, orig.get(n)!);
      if (next !== cur) n.nodeValue = next;
    } else if (n.nodeType === 1) {
      const el = n as Element;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") {
        n = walker.nextSibling() ?? walker.nextNode();
        continue;
      }
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (v == null) continue;
        const store = origAttr.get(el) ?? {};
        if (store[a] === undefined || v !== tr(lang, store[a])) store[a] = v;
        origAttr.set(el, store);
        const next = tr(lang, store[a]);
        if (next !== v) el.setAttribute(a, next);
      }
    }
    n = walker.nextNode();
  }
}

export function DomTranslator() {
  const { language } = useProfileSettings();
  useEffect(() => {
    let busy = false;
    const run = () => {
      busy = true;
      apply(document.body, language);
      document.title =
        tr(language, document.title.replace(" — Dastyor Food", "")) +
        (document.title.includes(" — Dastyor Food") ? " — Dastyor Food" : "");
      busy = false;
    };
    run();
    const mo = new MutationObserver(() => {
      if (!busy) run();
    });
    mo.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });
    document.documentElement.lang = language;
    return () => mo.disconnect();
  }, [language]);
  return null;
}
