import { Link } from "@tanstack/react-router";
import { memo, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import bannerBurger from "@/assets/banner-burger.jpg";
import pizza from "@/assets/pizza.jpg";
import lavash from "@/assets/lavash.jpg";
import { cn } from "@/lib/utils";

const slides = [
  {
    img: bannerBurger,
    badge: "-20% chegirma",
    title: "Eng yaxshi fast-foodlar endi bir joyda!",
    text: "Buyurtma bering va tezkor yetkazib berishni oling",
  },
  {
    img: pizza,
    badge: "Yangi",
    title: "Issiq pitsalar 30 daqiqada",
    text: "Sevimli pitsangizni uyga buyurtma qiling",
  },
  {
    img: lavash,
    badge: "Bepul yetkazish",
    title: "Lavash va donarlar",
    text: "Ko'pchilik xonalardan yetkazib berish — 0 UZS",
  },
];

export const BannerCarousel = memo(function BannerCarousel() {
  const [i, setI] = useState(0);
  const paused = useRef(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const onVisibilityChange = () => {
      paused.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const t = setInterval(() => {
      if (!paused.current && !document.hidden) {
        setI((v) => (v + 1) % slides.length);
      }
    }, 4000);

    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-ink"
      aria-roledescription="carousel"
      onTouchStart={(e) => {
        paused.current = true;
        startX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        paused.current = false;
        if (startX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? startX.current) - startX.current;
        if (Math.abs(dx) > 40) setI((v) => (v + (dx < 0 ? 1 : slides.length - 1)) % slides.length);
        startX.current = null;
      }}
    >
      <div
        className="flex transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {slides.map((s, k) => (
          <div key={k} className="relative min-h-44 w-full shrink-0" aria-hidden={k !== i}>
            <img
              src={s.img}
              alt=""
              width={1024}
              height={640}
              loading={k === 0 ? "eager" : "lazy"}
              fetchPriority={k === 0 ? "high" : "low"}
              decoding={k === 0 ? "sync" : "async"}
              className="absolute inset-y-0 right-0 h-full w-3/4 object-cover"
            />
            <div className="absolute inset-0 bg-banner" />
            <div className="relative max-w-[62%] p-5">
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                {s.badge}
              </span>
              <h2 className="mt-3 font-display text-xl font-bold leading-tight text-ink-foreground">
                {s.title}
              </h2>
              <p className="mt-1.5 text-xs text-ink-foreground/75">{s.text}</p>
              <Link
                to="/restaurants"
                tabIndex={k === i ? 0 : -1}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-cta"
              >
                Buyurtma berish <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {slides.map((_, k) => (
          <button
            key={k}
            aria-label={`${k + 1}-banner`}
            onClick={() => setI(k)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              k === i ? "w-5 bg-primary" : "w-1.5 bg-ink-foreground/50",
            )}
          />
        ))}
      </div>
    </section>
  );
});
