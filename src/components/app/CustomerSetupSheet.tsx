import { useState } from "react";
import { MapPin, Phone, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "./LocationPicker";
import { cart } from "@/lib/cart-store";
import { profileSettings, type DeliveryLocation } from "@/lib/profile-settings";
import { profileSchema } from "@/lib/form-validation";
import { cn } from "@/lib/utils";

/**
 * Demo registration bottom sheet: collects name, phone and a delivery location.
 * Data stays on this device (localStorage); the cart is never touched.
 */
export function CustomerSetupSheet({
  initialName,
  initialPhone,
  initialLocation,
  onDone,
  onClose,
}: {
  initialName: string;
  initialPhone: string;
  initialLocation: DeliveryLocation | null;
  onDone: () => void;
  onClose?: () => void;
}) {
  const [name, setName] = useState(initialName === "Mehmon" ? "" : initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [loc, setLoc] = useState<DeliveryLocation | null>(initialLocation);
  const [picking, setPicking] = useState(!initialLocation);
  const [err, setErr] = useState<{
    name?: string | undefined;
    phone?: string | undefined;
    location?: string | undefined;
  }>({});

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const r = profileSchema.safeParse({ name, phone });
    const next: typeof err = {};
    if (!r.success)
      for (const i of r.error.issues) next[i.path[0] as "name" | "phone"] ??= i.message;
    if (!loc) next.location = "Yetkazish manzilini tanlang";
    setErr(next);
    if (!r.success || !loc) return;
    cart.setProfile(r.data);
    profileSettings.setLocation(loc);
    toast.success("Ma'lumotlar saqlandi");
    onDone();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50"
      role="dialog"
      aria-modal="true"
      aria-label="Ro'yxatdan o'tish"
    >
      <div className="max-h-[88%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-5 pb-8 animate-in slide-in-from-bottom duration-300">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Ro'yxatdan o'tish</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Buyurtma berish uchun ism, telefon va yetkazish manzili kerak. Savatingiz saqlanib
              qoladi.
            </p>
          </div>
          {onClose && (
            <Button
              variant="unstyled"
              size="unset"
              aria-label="Yopish"
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <form onSubmit={save} noValidate className="space-y-4">
          <Field
            label="Ism"
            value={name}
            placeholder="Ismingizni kiriting"
            icon={<User className="h-4 w-4 text-muted-foreground/80" />}
            error={err.name}
            autoComplete="name"
            onChange={(v) => {
              setName(v);
              setErr((p) => ({ ...p, name: undefined }));
            }}
          />
          <Field
            label="Telefon raqami"
            value={phone}
            placeholder="+998 90 123 45 67"
            icon={<Phone className="h-4 w-4 text-muted-foreground/80" />}
            error={err.phone}
            inputMode="tel"
            autoComplete="tel"
            onChange={(v) => {
              setPhone(v);
              setErr((p) => ({ ...p, phone: undefined }));
            }}
          />

          <section className="space-y-2">
            <span className="block text-xs font-semibold text-muted-foreground">
              Yetkazish manzili
            </span>
            {picking ? (
              <LocationPicker
                initial={loc}
                onConfirm={(l) => {
                  setLoc(l);
                  setPicking(false);
                  setErr((p) => ({ ...p, location: undefined }));
                }}
                onCancel={loc ? () => setPicking(false) : undefined}
              />
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="min-w-0 flex-1 break-words text-sm font-semibold">{loc?.address}</p>
                <Button
                  variant="unstyled"
                  size="unset"
                  type="button"
                  onClick={() => setPicking(true)}
                  className="shrink-0 text-xs font-bold text-primary"
                >
                  O'zgartirish
                </Button>
              </div>
            )}
            {err.location && (
              <p className="text-[11px] font-medium text-destructive">{err.location}</p>
            )}
          </section>

          {!picking && (
            <Button
              variant="unstyled"
              size="unset"
              type="submit"
              data-testid="setup-save"
              className="h-14 w-full rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta active:scale-[0.98]"
            >
              Saqlash va davom etish
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  icon,
  onChange,
  ...p
}: {
  label: string;
  error?: string | undefined;
  icon?: React.ReactNode;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      <div
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-2xl border bg-muted/40 px-3.5 transition-all focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/10 shadow-xs",
          error
            ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/10"
            : "border-border/70 hover:border-border",
        )}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <input
          {...p}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      {error && (
        <span className="mt-1 block text-[11px] font-medium text-destructive">{error}</span>
      )}
    </label>
  );
}
