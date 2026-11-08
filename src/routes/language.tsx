import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

const FLAGS = {
  uz: (
    <svg
      viewBox="0 0 30 20"
      className="h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.4" fill="#1EB5E6" />
      <rect y="13.6" width="30" height="6.4" fill="#1EB53A" />
      <rect y="6.2" width="30" height=".6" fill="#CE1126" />
      <rect y="13.2" width="30" height=".6" fill="#CE1126" />
      <circle cx="4.5" cy="3.2" r="2.2" fill="#fff" />
      <circle cx="5.3" cy="3.2" r="2" fill="#1EB5E6" />
      {[
        [10, 1.4],
        [12, 1.4],
        [14, 1.4],
        [8, 3.2],
        [10, 3.2],
        [12, 3.2],
        [14, 3.2],
        [6, 5],
        [8, 5],
        [10, 5],
        [12, 5],
        [14, 5],
      ].map(([x, y], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y})`}
          d="M0,-.65 .15,-.2 .62,-.2 .25,.08 .39,.53 0,.25 -.39,.53 -.25,.08 -.62,-.2 -.15,-.2Z"
          fill="#fff"
        />
      ))}
    </svg>
  ),
  ru: (
    <svg
      viewBox="0 0 30 20"
      className="h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="30" height="20" fill="#fff" />
      <rect y="6.67" width="30" height="6.67" fill="#0039A6" />
      <rect y="13.33" width="30" height="6.67" fill="#D52B1E" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 60 30" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 60,30M60,0 0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 60,30M60,0 0,30" stroke="#C8102E" strokeWidth="2" />
      <path d="M30,0V30M0,15H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0V30M0,15H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  ),
} as const;
import { AppShell } from "@/components/app/BottomNav";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { profileSettings, useProfileSettings } from "@/lib/profile-settings";
import { LANGS, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/language")({
  head: () => ({
    meta: [
      { title: "Til sozlamalari — Dastyor Food" },
      { name: "description", content: "Dastyor Food interfeys tili: o'zbek, rus yoki ingliz." },
      { property: "og:title", content: "Til sozlamalari — Dastyor Food" },
      { property: "og:description", content: "Dastyor Food interfeys tili: o'zbek, rus yoki ingliz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LanguagePage,
});

function LanguagePage() {
  const t = useT();
  const { language } = useProfileSettings();
  return (
    <AppShell>
      <PageHeader title={t("Til sozlamalari")} back="/profile" />
      <main className="space-y-5 px-5 pb-20">
        <p className="text-sm text-muted-foreground">{t("Interfeys tili")}</p>
        <div
          className="overflow-hidden rounded-2xl border border-border bg-card"
          role="radiogroup"
          aria-label={t("Interfeys tili")}
        >
          {LANGS.map((l, idx) => {
            const on = l.id === language;
            return (
              <Button
                key={l.id}
                variant="unstyled"
                size="unset"
                role="radio"
                aria-checked={on}
                onClick={() => profileSettings.setLanguage(l.id)}
                className={cn(
                  "flex h-20 w-full items-center justify-start gap-4 rounded-none px-4 text-left transition-colors",
                  idx > 0 && "border-t border-border",
                  on && "bg-primary-soft",
                )}
              >
                <span
                  aria-hidden="true"
                  className="block h-8 w-12 shrink-0 overflow-hidden rounded-sm ring-1 ring-border [&_svg]:block [&_svg]:size-full!"
                >
                  {FLAGS[l.id]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{l.label}</span>
                  <span className="block text-xs text-muted-foreground">{l.id.toUpperCase()}</span>
                </span>
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full border-2",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
              </Button>
            );
          })}
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-4 text-sm">
          <span className="text-muted-foreground">{t("Pul birligi")}</span>
          <span className="font-bold">{t("UZS — O'zbek so'mi")}</span>
        </div>
      </main>
    </AppShell>
  );
}
