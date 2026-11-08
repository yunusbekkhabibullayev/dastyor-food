import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { reverseGeocode } from "@/lib/geocode";
import { useT } from "@/lib/i18n";
import { useProfileSettings, type DeliveryLocation } from "@/lib/profile-settings";
import { cn } from "@/lib/utils";

const TASHKENT: [number, number] = [41.3111, 69.2797];

/**
 * Free map picker (Leaflet + OpenStreetMap, no API key). The pin is fixed in the
 * centre; the user pans the map and the address is reverse-geocoded. Leaflet is
 * dynamically imported inside an effect so it never runs during SSR.
 */
export function LocationPicker({
  initial,
  onConfirm,
  onCancel,
}: {
  initial?: DeliveryLocation | null;
  onConfirm: (loc: DeliveryLocation) => void;
  onCancel?: (() => void) | undefined;
}) {
  const t = useT();
  const { language } = useProfileSettings();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const langRef = useRef(language);
  langRef.current = language;
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [point, setPoint] = useState<[number, number] | null>(
    initial?.lat != null && initial?.lng != null ? [initial.lat, initial.lng] : null,
  );
  const [address, setAddress] = useState(initial?.address ?? "");
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    let disposed = false;
    let seq = 0;
    void import("leaflet").then((L) => {
      if (disposed || !box.current) return;
      const start: [number, number] =
        initial?.lat != null && initial?.lng != null ? [initial.lat, initial.lng] : TASHKENT;
      const map = L.map(box.current, { zoomControl: true, attributionControl: true }).setView(
        start,
        initial?.lat != null ? 16 : 12,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      mapRef.current = map;
      map.on("moveend", () => {
        const c = map.getCenter();
        const id = ++seq;
        setPoint([c.lat, c.lng]);
        setBusy(true);
        void reverseGeocode(c.lat, c.lng, langRef.current).then((a) => {
          if (disposed || id !== seq) return;
          setBusy(false);
          setAddress(a ?? `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`);
        });
      });
      setReady(true);
      setTimeout(() => map.invalidateSize(), 50);
    });
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locate = () => {
    setGeoError("");
    if (!("geolocation" in navigator)) {
      setGeoError(t("Geolokatsiya qo'llab-quvvatlanmaydi"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 17),
      () => setGeoError(t("Joylashuvga ruxsat berilmadi — xaritadan qo'lda tanlang")),
      { timeout: 8000 },
    );
  };

  const disabled = !point || !address.trim() || busy;

  return (
    <div className="space-y-3">
      <div className="relative h-64 overflow-hidden rounded-3xl border border-border bg-muted">
        <div ref={box} className="absolute inset-0 z-0" data-testid="delivery-map" />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {ready && (
          <MapPin
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-[500] h-9 w-9 -translate-x-1/2 -translate-y-full fill-primary text-primary-foreground drop-shadow"
          />
        )}
        <Button
          variant="unstyled"
          size="unset"
          type="button"
          aria-label={t("Mening joylashuvim")}
          onClick={locate}
          className="absolute right-3 top-3 z-[500] grid h-10 w-10 place-items-center rounded-full border border-border bg-background shadow-card"
        >
          <Navigation className="h-4 w-4 text-primary" />
        </Button>
      </div>
      <div className="flex items-start gap-2.5 rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <MapPin className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold text-muted-foreground">
            {t("Tanlangan manzil")}
          </span>
          <p
            className="mt-0.5 text-xs font-semibold text-foreground break-words"
            data-testid="picked-address"
          >
            {busy
              ? t("Manzil aniqlanmoqda...")
              : address || t("Xaritadan nuqta tanlang yoki belgini sudrang")}
          </p>
        </div>
      </div>
      {geoError && <p className="text-[11px] font-medium text-destructive">{geoError}</p>}
      <div className={cn("grid gap-3", onCancel ? "grid-cols-2" : "grid-cols-1")}>
        {onCancel && (
          <Button
            variant="unstyled"
            size="unset"
            type="button"
            onClick={onCancel}
            className="h-12 rounded-2xl border border-border font-bold"
          >
            {t("Bekor qilish")}
          </Button>
        )}
        <Button
          variant="unstyled"
          size="unset"
          type="button"
          disabled={disabled}
          data-testid="confirm-location"
          onClick={() =>
            point && onConfirm({ lat: point[0], lng: point[1], address: address.trim() })
          }
          className="min-h-12 min-w-0 whitespace-normal rounded-2xl bg-primary px-3 py-2 text-sm font-bold leading-snug text-primary-foreground shadow-cta disabled:opacity-60"
        >
          {t("Ushbu manzilni tasdiqlash")}
        </Button>
      </div>
    </div>
  );
}
