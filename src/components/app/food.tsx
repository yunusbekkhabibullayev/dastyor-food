import { Link } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Beef,
  Drumstick,
  Pizza as PizzaIcon,
  Sandwich,
  Bike,
  Clock,
  Heart,
  Minus,
  Plus,
  Search,
  SearchX,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  cart,
  useCart,
  useCartItemQty,
  useIsProductLiked,
  useIsRestaurantLiked,
} from "@/lib/cart-store";
import {
  restaurants,
  formatDelivery,
  formatSom,
  type Product,
  type Restaurant,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-border/60 bg-muted/50 px-3.5 transition-all focus-within:border-primary/50 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/10 shadow-xs">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground/80" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[13px] placeholder:text-muted-foreground/75 leading-normal"
      />
      {value && (
        <Button variant="unstyled" size="unset" aria-label="Tozalash" onClick={() => onChange("")}>
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </label>
  );
}

export function Chips({
  items,
  value,
  onChange,
}: {
  items: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5" role="tablist">
      {items.map((c) => (
        <Button
          variant="unstyled"
          size="unset"
          key={c}
          role="tab"
          aria-selected={c === value}
          onClick={() => onChange(c)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            c === value
              ? "border-ink bg-ink text-ink-foreground"
              : "border-border bg-background text-muted-foreground",
          )}
        >
          {c}
        </Button>
      ))}
    </div>
  );
}

export function EmptyState({
  text = "Hech narsa topilmadi",
  onReset,
}: {
  text?: string;
  onReset?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-muted px-6 py-10 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground" />
      <p className="mt-3 font-display font-semibold">{text}</p>
      <p className="mt-1 text-xs text-muted-foreground">Boshqa so'z bilan qidirib ko'ring</p>
      {onReset && (
        <Button
          variant="unstyled"
          size="unset"
          onClick={onReset}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
        >
          Tozalash
        </Button>
      )}
    </div>
  );
}

const logoIcon = {
  Burgerlar: Beef,
  Lavash: Sandwich,
  Pizza: PizzaIcon,
  Tovuq: Drumstick,
  Kartoshka: Beef,
  Ichimliklar: Beef,
  Souslar: Beef,
} as const;

export function RestaurantLogo({
  r,
  className,
  big,
}: {
  r: Restaurant;
  className?: string;
  big?: boolean;
}) {
  if (r.logo) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm",
          className,
        )}
        aria-label={`${r.name} logotipi`}
      >
        <img src={r.logo} alt={r.name} className="h-full w-full object-cover" />
      </div>
    );
  }
  const Icon = logoIcon[r.category];
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl font-display font-extrabold leading-none",
        r.tone,
        className,
      )}
      aria-label={`${r.name} logotipi`}
    >
      <span className="absolute -right-3 -top-3 h-2/3 w-2/3 rounded-full bg-current opacity-10" />
      <Icon className={big ? "h-8 w-8" : "h-4 w-4"} strokeWidth={2.4} />
      <span className={cn("mt-1 tracking-tight", big ? "text-sm" : "text-[8px]")}>{r.short}</span>
    </div>
  );
}

export const RestaurantCard = memo(function RestaurantCard({ r }: { r: Restaurant }) {
  return (
    <Link
      to="/restaurants/$restaurantId"
      params={{ restaurantId: r.id }}
      className="block overflow-hidden rounded-3xl border border-border bg-card shadow-card active:scale-[0.99]"
    >
      <div className="relative">
        <img
          src={r.cover}
          alt={r.name}
          loading="lazy"
          decoding="async"
          width={600}
          height={300}
          className="aspect-[2/1] w-full object-cover"
        />
        {r.delivery === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
            Bepul yetkazish
          </span>
        )}
        <LikeRestaurantButton id={r.id} className="absolute right-3 top-3" />
        <RestaurantLogo
          r={r}
          className="absolute -bottom-6 left-4 z-10 h-14 w-14 border-2 border-background shadow-card"
        />
      </div>
      <div className="px-4 pb-4 pt-8">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-display font-bold">{r.name}</p>
          <p className="flex shrink-0 items-center gap-1 text-xs font-semibold">
            <Star className="h-3.5 w-3.5 fill-star text-star" /> {r.rating}
            <span className="font-normal text-muted-foreground">({r.reviews})</span>
          </p>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{r.tags.join(" · ")}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {r.time} daq
          </span>
          <span className="flex items-center gap-1">
            <Bike className="h-3.5 w-3.5" /> {formatDelivery(r.delivery)}
          </span>
        </div>
      </div>
    </Link>
  );
});

export const LikeRestaurantButton = memo(function LikeRestaurantButton({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const on = useIsRestaurantLiked(id);
  return (
    <Button
      variant="unstyled"
      size="unset"
      aria-label={on ? "Sevimlilardan olib tashlash" : "Xonani sevimlilarga qo'shish"}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        cart.toggleLikeRestaurant(id);
      }}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur-md shadow-card transition-all active:scale-90 border border-border/40",
        on ? "text-primary" : "text-foreground/80 hover:text-foreground",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-transform",
          on ? "fill-primary text-primary scale-110" : "",
        )}
        strokeWidth={2.2}
      />
    </Button>
  );
});

export const ProductCard = memo(function ProductCard({
  p,
  onOpen,
  priority = false,
}: {
  p: Product;
  onOpen: (p: Product) => void;
  priority?: boolean;
}) {
  const qty = useCartItemQty(p.id);
  const liked = useIsProductLiked(p.id);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // If the image is already cached or complete, immediately show it without skeleton delay
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, [p.image]);

  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="relative overflow-hidden">
        {/* Shimmer skeleton background until image is loaded */}
        {!imageLoaded && (
          <div className="absolute inset-0 aspect-[4/3] w-full fb-skeleton" />
        )}
        <Button
          variant="unstyled"
          size="unset"
          onClick={() => onOpen(p)}
          className="block w-full"
          aria-label={`${p.name} tafsilotlari`}
        >
          <img
            ref={imgRef}
            src={p.image}
            alt={p.name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "low"}
            decoding={priority ? "sync" : "async"}
            width={400}
            height={300}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "aspect-[4/3] w-full object-cover transition-all duration-300",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
            )}
          />
        </Button>
        <Button
          variant="unstyled"
          size="unset"
          aria-label={liked ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
          aria-pressed={liked}
          onClick={() => cart.toggleLike(p.id)}
          className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/90 backdrop-blur-xs shadow-xs"
        >
          <Heart
            className={cn("h-4 w-4", liked ? "fill-primary text-primary" : "text-foreground")}
          />
        </Button>
      </div>
      <div className="p-3">
        <Button
          variant="unstyled"
          size="unset"
          onClick={() => onOpen(p)}
          className="block w-full min-w-0 text-left"
        >
          <p className="truncate text-sm font-bold">{p.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{p.restaurant}</p>
        </Button>
        <div className="mt-2 flex items-center justify-between gap-1">
          <p className="truncate text-sm font-extrabold">{formatSom(p.price)}</p>
          {qty === 0 ? (
            <Button
              variant="unstyled"
              size="unset"
              aria-label="Savatga qo'shish"
              onClick={() => {
                addToCart(p);
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground active:scale-90"
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : (
            <Stepper id={p.id} qty={qty} small />
          )}
        </div>
      </div>
    </article>
  );
});

export function addToCart(p: Product, qty = 1) {
  if (cart.add(p.id, qty) === "conflict") {
    toast("Savatda boshqa xona taomlari bor", {
      description: "Bitta buyurtmada faqat bitta xonadan taom bo'lishi mumkin.",
      action: {
        label: "Yangilash",
        onClick: () => {
          cart.add(p.id, qty, true);
          toast.success(`Savat yangilandi: ${p.name}`);
        },
      },
    });
    return;
  }
  toast.success(qty > 1 ? `${qty} ta ${p.name} savatga qo'shildi` : `${p.name} savatga qo'shildi`);
}

export function Stepper({ id, qty, small }: { id: string; qty: number; small?: boolean }) {
  const sz = small ? "h-7 w-7" : "h-10 w-10";
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft p-0.5">
      <Button
        variant="unstyled"
        size="unset"
        aria-label="Kamaytirish"
        onClick={() => cart.dec(id)}
        className={cn("grid place-items-center rounded-full bg-background", sz)}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-4 text-center text-sm font-bold" data-testid="qty">
        {qty}
      </span>
      <Button
        variant="unstyled"
        size="unset"
        aria-label="Ko'paytirish"
        onClick={() => cart.add(id)}
        className={cn(
          "grid place-items-center rounded-full bg-primary text-primary-foreground",
          sz,
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function ProductSheet({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [sheetImgLoaded, setSheetImgLoaded] = useState(false);
  const sheetImgRef = useRef<HTMLImageElement | null>(null);
  const s = useCart();
  const liked = product ? s.liked.includes(product.id) : false;

  useEffect(() => {
    if (product && sheetImgRef.current?.complete) {
      setSheetImgLoaded(true);
    }
  }, [product]);

  return (
    <Sheet
      open={!!product}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setQty(1);
          setSheetImgLoaded(false);
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="mx-auto app-sheet max-w-md rounded-t-3xl p-0 overflow-hidden border-t-0 shadow-2xl"
      >
        {product && (
          <>
            <div className="relative w-full aspect-[16/10] overflow-hidden fb-skeleton">
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 h-1 w-10 rounded-full bg-white/70 backdrop-blur-md pointer-events-none" />
              <img
                ref={sheetImgRef}
                src={product.image}
                alt={product.name}
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                width={800}
                height={500}
                onLoad={() => setSheetImgLoaded(true)}
                className={cn(
                  "h-full w-full object-cover transition-all duration-300",
                  sheetImgLoaded ? "opacity-100" : "opacity-0",
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-black/20 pointer-events-none" />
            </div>
            <div className="pb-safe space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="font-display text-xl font-bold">{product.name}</SheetTitle>
                  <p className="text-xs font-semibold text-primary">
                    {product.restaurant} · {product.category}
                  </p>
                </div>
                <Button
                  variant="unstyled"
                  size="unset"
                  aria-label="Sevimlilarga"
                  onClick={() => cart.toggleLike(product.id)}
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all active:scale-90 border",
                    liked
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-transform",
                      liked ? "fill-primary text-primary scale-110" : "",
                    )}
                    strokeWidth={2.2}
                  />
                </Button>
              </div>
              <SheetDescription className="text-sm text-muted-foreground">
                {product.description}
              </SheetDescription>
              <div className="flex items-center justify-between">
                <p className="font-display text-2xl font-extrabold">
                  {formatSom(product.price * qty)}
                </p>
                <div className="flex items-center gap-3 rounded-full bg-muted p-1">
                  <Button
                    variant="unstyled"
                    size="unset"
                    aria-label="Kamaytirish"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-9 w-9 place-items-center rounded-full bg-background"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-5 text-center font-bold">{qty}</span>
                  <Button
                    variant="unstyled"
                    size="unset"
                    aria-label="Ko'paytirish"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-background"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="unstyled"
                size="unset"
                onClick={() => {
                  addToCart(product, qty);
                  setQty(1);
                  onClose();
                }}
                className="h-14 w-full rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta active:scale-[0.98]"
              >
                Savatga qo'shish
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
