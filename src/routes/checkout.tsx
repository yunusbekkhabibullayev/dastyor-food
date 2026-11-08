import { Button } from "@/components/ui/button";
import { createFileRoute, useHydrated, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Check, MapPin, Phone, User } from "lucide-react";
import { AppShell } from "@/components/app/BottomNav";
import { PageHeader } from "@/components/app/PageHeader";
import { CustomerSetupSheet } from "@/components/app/CustomerSetupSheet";
import { LocationPicker } from "@/components/app/LocationPicker";
import { cart, cartTotals, useCart, type Order } from "@/lib/cart-store";
import { submitTelegramOrder } from "@/lib/telegram-orders";
import { useT } from "@/lib/i18n";
import { formatAddress, profileSettings, useProfileSettings } from "@/lib/profile-settings";
import { customerReady } from "@/lib/form-validation";
import { formatDelivery, formatSom, getRestaurant } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Buyurtma berish — Dastyor Food" },
      { name: "description", content: "Yetkazish manzilini tanlang va buyurtmani tasdiqlang." },
      { property: "og:title", content: "Buyurtma berish — Dastyor Food" },
      {
        property: "og:description",
        content: "Yetkazish manzilini tanlang va buyurtmani tasdiqlang.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const s = useCart();
  const settings = useProfileSettings();
  const ready = useHydrated() && !!s.ready;
  const t = cartTotals(s);
  const r = t.restaurantId ? getRestaurant(t.restaurantId) : undefined;
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sendError, setSendError] = useState("");
  const sending = useRef(false);
  const pendingOrder = useRef<Order | null>(null);
  const translate = useT();
  const registered = customerReady(s.profile, settings.location);
  const loc = settings.location;

  if (!ready)
    return (
      <AppShell>
        <PageHeader title="Buyurtma berish" back="/cart" />
      </AppShell>
    );
  if (t.lines.length === 0)
    return (
      <AppShell>
        <PageHeader title="Buyurtma berish" back="/cart" />
        <div className="px-8 pt-16 text-center">
          <p className="font-display text-lg font-bold">Savat bo'sh</p>
          <Link to="/restaurants" className="mt-4 inline-block font-semibold text-primary">
            Xonalarni ko'rish
          </Link>
        </div>
      </AppShell>
    );

  if (!registered)
    return (
      <AppShell>
        <PageHeader title="Buyurtma berish" back="/cart" />
        <div className="space-y-3 px-8 pt-16 text-center">
          <p className="font-display text-lg font-bold">
            Buyurtma berish uchun avval ro'yxatdan o'ting
          </p>
          <p className="text-sm text-muted-foreground">
            Ism, telefon raqam va yetkazish manzili kerak — savatingiz o'chirilmaydi.
          </p>
        </div>
        <CustomerSetupSheet
          initialName={s.profile.name}
          initialPhone={s.profile.phone}
          initialLocation={loc}
          onDone={() => {
            /* store update re-renders this page as registered */
          }}
          onClose={() => navigate({ to: "/cart" })}
        />
      </AppShell>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending.current || !loc) return;
    const draft = cart.createOrder({
      name: s.profile.name,
      phone: s.profile.phone,
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      notes: notes.trim() || undefined,
    });
    if (!draft) return;
    const previous = pendingOrder.current;
    // Reuse the ID on unchanged retries; changed customer/cart gets a new draft.
    const unchanged =
      previous &&
      JSON.stringify([previous.customer, previous.lines, previous.total]) ===
        JSON.stringify([draft.customer, draft.lines, draft.total]);
    const order = unchanged ? previous : draft;
    pendingOrder.current = order;
    sending.current = true;
    setSubmitted(true);
    setSendError("");
    try {
      await submitTelegramOrder(order);
      void navigate({ to: "/order-success" });
    } catch (error) {
      setSendError(
        error instanceof Error && error.message === "TELEGRAM_NOT_CONFIGURED"
          ? translate(
              "Telegram orqali buyurtma yuborish hali sozlanmagan. Buyurtma yuborilmadi, savatingiz saqlandi.",
            )
          : translate("Buyurtma yuborilmadi. Savatingiz saqlandi. Qayta urinib ko'ring."),
      );
    } finally {
      sending.current = false;
      setSubmitted(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Buyurtma berish" back="/cart" />
      <form onSubmit={submit} noValidate className="space-y-6 px-5 pb-10">
        <Section title="Mijoz ma'lumotlari">
          <div className="space-y-2 rounded-3xl border border-border bg-card p-4 shadow-card">
            <p className="flex items-center gap-3 text-sm font-semibold">
              <User className="h-4 w-4 shrink-0 text-primary" />{" "}
              <span className="truncate" data-testid="checkout-name">
                {s.profile.name}
              </span>
            </p>
            <p className="flex items-center gap-3 text-sm font-semibold">
              <Phone className="h-4 w-4 shrink-0 text-primary" />{" "}
              <span className="truncate">{s.profile.phone}</span>
            </p>
            <Link to="/profile" className="inline-block pt-1 text-xs font-bold text-primary">
              Profil orqali o'zgartirish
            </Link>
          </div>
        </Section>

        <Section title="Yetkazish manzili">
          {editingLocation ? (
            <LocationPicker
              initial={loc}
              onConfirm={(l) => {
                profileSettings.setLocation(l);
                setEditingLocation(false);
              }}
              onCancel={() => setEditingLocation(false)}
            />
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4 shadow-card">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p
                  className="min-w-0 flex-1 break-words text-sm font-semibold"
                  data-testid="checkout-address"
                >
                  {loc?.address}
                </p>
                <Button
                  variant="unstyled"
                  size="unset"
                  type="button"
                  onClick={() => setEditingLocation(true)}
                  className="shrink-0 text-xs font-bold text-primary"
                >
                  Xaritadan o'zgartirish
                </Button>
              </div>
              {settings.addresses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {settings.addresses.map((a) => {
                    const text = formatAddress(a);
                    const on = loc?.address === text;
                    return (
                      <Button
                        variant="unstyled"
                        size="unset"
                        type="button"
                        key={a.id}
                        onClick={() =>
                          profileSettings.setLocation({ lat: a.lat, lng: a.lng, address: text })
                        }
                        className={cn(
                          "flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-bold",
                          on ? "border-primary bg-primary-soft text-primary" : "border-border",
                        )}
                      >
                        {on && <Check className="h-3.5 w-3.5" />}
                        {a.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Section>

        <Section title="Kuryer uchun izoh (ixtiyoriy)">
          <textarea
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Masalan: domofon 12, 3-qavat"
            className="w-full rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/10 shadow-xs resize-none"
          />
        </Section>

        <Section title={`Buyurtma tarkibi${r ? ` · ${r.name}` : ""}`}>
          <ul className="space-y-2">
            {t.lines.map((l) => (
              <li key={l.product.id} className="flex items-center gap-3 text-sm">
                <img
                  src={l.product.image}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-xl object-cover"
                />
                <span className="min-w-0 flex-1 truncate">
                  {l.product.name} <span className="text-muted-foreground">× {l.qty}</span>
                </span>
                <span className="shrink-0 font-semibold">{formatSom(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Taomlar</span>
              <span className="font-semibold text-foreground">{formatSom(t.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Yetkazib berish</span>
              <span className="font-semibold text-foreground">{formatDelivery(t.delivery)}</span>
            </div>
            <div className="flex justify-between pt-1 font-display text-lg font-extrabold">
              <span>Jami</span>
              <span data-testid="checkout-total">{formatSom(t.total)}</span>
            </div>
          </div>
        </Section>

        {sendError && (
          <p role="alert" className="text-sm font-semibold text-destructive">
            {sendError}
          </p>
        )}
        <Button
          variant="unstyled"
          size="unset"
          type="submit"
          disabled={submitted}
          data-testid="place-order"
          className="h-14 w-full rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta active:scale-[0.98] disabled:opacity-60"
        >
          {submitted ? "Yuborilmoqda..." : `Buyurtmani tasdiqlash · ${formatSom(t.total)}`}
        </Button>
      </form>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}
