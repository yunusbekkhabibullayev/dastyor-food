import { Button } from "@/components/ui/button";
import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronRight,
  Globe,
  Heart,
  ClipboardList,
  MapPin,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { profileSchema } from "@/lib/form-validation";
import { AppShell } from "@/components/app/BottomNav";
import { cart, useCart } from "@/lib/cart-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Profil — Dastyor Food" },
      { name: "description", content: "Profil, manzillar va sozlamalar." },
      { property: "og:title", content: "Profil — Dastyor Food" },
      { property: "og:description", content: "Profil, manzillar va sozlamalar." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const s = useCart();
  const ready = useHydrated() && !!s.ready;
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(s.profile);
  const [err, setErr] = useState<{ name?: string | undefined; phone?: string | undefined }>({});
  useEffect(() => {
    if (!editing) setF(s.profile);
  }, [s.profile, editing]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const r = profileSchema.safeParse(f);
    if (!r.success) {
      const x: typeof err = {};
      for (const i of r.error.issues) x[i.path[0] as "name" | "phone"] ??= i.message;
      setErr(x);
      return;
    }
    cart.setProfile(r.data);
    setEditing(false);
    toast.success("Profil saqlandi");
  };

  const name = ready ? s.profile.name : "";
  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <AppShell>
      <header className="pt-safe px-5 pb-3">
        <h1 className="font-display text-2xl font-bold">Profil</h1>
      </header>
      <main className="space-y-5 px-5 pb-6">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          {!editing ? (
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-bold" data-testid="profile-name">
                  {name}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {ready ? s.profile.phone : ""}
                </p>
              </div>
              <Button
                variant="unstyled"
                size="unset"
                disabled={!ready}
                aria-label="Tahrirlash"
                onClick={() => setEditing(true)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <form onSubmit={save} noValidate className="space-y-3">
              <Input
                label="Ism"
                name="name"
                value={f.name}
                error={err.name}
                onChange={(v) => {
                  setF({ ...f, name: v });
                  setErr({ ...err, name: undefined });
                }}
              />
              <Input
                label="Telefon raqami"
                name="phone"
                value={f.phone}
                error={err.phone}
                inputMode="tel"
                onChange={(v) => {
                  setF({ ...f, phone: v });
                  setErr({ ...err, phone: undefined });
                }}
              />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button
                  variant="unstyled"
                  size="unset"
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setErr({});
                  }}
                  className="h-12 rounded-2xl border border-border font-bold"
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="unstyled"
                  size="unset"
                  type="submit"
                  className="h-12 rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta"
                >
                  Saqlash
                </Button>
              </div>
            </form>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <NavRow to="/orders" icon={ClipboardList} label="Buyurtmalarim" />
          <NavRow to="/favorites" icon={Heart} label="Sevimlilar" />
        </section>

        <section>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Manzillar
          </h2>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <NavRow to="/addresses" icon={MapPin} label="Saqlangan manzillar" />
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Sozlamalar
          </h2>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <NavRow to="/notifications" icon={Bell} label="Bildirishnomalar" />
            <NavRow to="/language" icon={Globe} label="Til sozlamalari" />
            <NavRow to="/privacy" icon={ShieldCheck} label="Maxfiylik" />
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Input({
  label,
  error,
  onChange,
  ...p
}: { label: string; error?: string | undefined; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        {...p}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`h-12 w-full rounded-2xl border bg-muted px-4 text-sm outline-none focus:border-primary ${error ? "border-destructive" : "border-border"}`}
      />
      {error && (
        <span className="mt-1 block text-[11px] font-medium text-destructive">{error}</span>
      )}
    </label>
  );
}

function NavRow({
  to,
  icon: Icon,
  label,
}: {
  to: "/orders" | "/favorites" | "/addresses" | "/notifications" | "/language" | "/privacy";
  icon: typeof MapPin;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex h-14 items-center gap-3 border-b border-border px-4 text-sm font-semibold last:border-b-0"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
