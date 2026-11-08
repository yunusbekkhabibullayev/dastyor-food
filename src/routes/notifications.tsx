import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { AppShell } from "@/components/app/BottomNav";
import { PageHeader } from "@/components/app/PageHeader";
import { Switch } from "@/components/ui/switch";
import { profileSettings, useProfileSettings } from "@/lib/profile-settings";
export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Bildirishnomalar — Dastyor Food" },
      { name: "description", content: "Bildirishnoma sozlamalari." },
      { property: "og:title", content: "Bildirishnomalar — Dastyor Food" },
      { property: "og:description", content: "Bildirishnoma sozlamalari." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});
function NotificationsPage() {
  const s = useProfileSettings();
  const ready = useHydrated();
  return (
    <AppShell>
      <PageHeader title="Bildirishnomalar" back="/profile" />
      <main className="px-5">
        {(
          [
            ["orders", "Buyurtma holati"],
            ["offers", "Takliflar va chegirmalar"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex min-h-16 items-center justify-between gap-4 border-b border-border py-4 text-sm font-semibold"
          >
            <span>{label}</span>
            <Switch
              aria-label={label}
              disabled={!ready}
              checked={ready && s.notifications[key]}
              onCheckedChange={(v) => profileSettings.setNotification(key, v)}
            />
          </label>
        ))}
      </main>
    </AppShell>
  );
}
