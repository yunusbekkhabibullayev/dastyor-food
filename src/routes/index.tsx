import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import onboardingDastyor from "@/assets/onboarding-dastyor.png";
import pizza from "@/assets/pizza.jpg";
import chicken from "@/assets/chicken.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "dastyor_onboarding_completed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Dastyor Food" },
      {
        name: "description",
        content: "Tumandagi barcha fast-food xonalardan tez va qulay buyurtma bering.",
      },
      { property: "og:title", content: "Dastyor Food" },
      {
        property: "og:description",
        content: "Tumandagi barcha fast-food xonalardan tez va qulay buyurtma bering.",
      },
    ],
  }),
  component: Onboarding,
});

const steps = [
  {
    img: null, // 1-step: qora fon + logo
    title: "Tumandagi barcha fast-food xonalar bir ilovada!",
    text: "Evos, Max Way, Bellissimo va boshqa sevimli xonalaringiz.",
  },
  {
    img: pizza,
    title: "Sevimli taomingizni tanlang",
    text: "Menyuni ko'ring, savatga qo'shing va bir necha bosishda buyurtma bering.",
  },
  {
    img: chicken,
    title: "Tezkor yetkazib berish",
    text: "Manzilni xaritadan belgilang va buyurtma holatini kuzatib boring.",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    // Agar foydalanuvchi allaqachon onboardingdan o'tgan bo'lsa, to'g'ridan-to'g'ri /home ga o'tadi
    if (typeof window !== "undefined") {
      const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
      if (hasCompleted === "true") {
        void navigate({ to: "/home", replace: true });
        return;
      }
      setIsClientReady(true);
    }
  }, [navigate]);

  const finishOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
    void navigate({ to: "/home" });
  };

  const last = i === steps.length - 1;
  const step = steps[i] ?? steps[0];

  // Agar allaqachon o'tgan bo'lsa yoki tekshirilayotgan bo'lsa, miltillashning oldini olish
  if (!isClientReady || !step) {
    return <div className="min-h-screen bg-ink" />;
  }

  return (
    <div className="app-splash relative mx-auto max-w-md overflow-hidden bg-ink">

      {/* 1-step: qora fon + Dastyor Food logo yuqoriroqda chiroyli joylashishi */}
      <div
        className={cn(
          "absolute inset-x-0 top-16 bottom-[42%] flex items-center justify-center bg-ink transition-opacity duration-700 px-8",
          i === 0 ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <img
          src={onboardingDastyor}
          alt="Dastyor Food"
          className="max-h-60 w-auto max-w-[85%] object-contain drop-shadow-2xl"
        />
      </div>

      {/* 2 va 3-step: to'liq ekran rasmlari */}
      {steps.map((s, k) =>
        k === 0 || !s.img ? null : (
          <img
            key={k}
            src={s.img}
            alt=""
            width={768}
            height={1344}
            className={cn(
              "absolute inset-x-0 top-0 h-full w-full object-cover transition-opacity duration-700",
              k === i ? "opacity-100" : "opacity-0",
            )}
          />
        ),
      )}

      {/* Qoʻyimcha gradient qatlam (2 va 3-step uchun) */}
      {i !== 0 && <div className="absolute inset-0 bg-onboarding" />}

      {/* Kontent */}
      <div className="pt-safe relative flex h-full flex-col px-7 pb-6 text-left">
        <div className="flex min-h-12 items-center justify-between gap-4">
          <p className="text-xs font-bold text-ink-foreground/80">{i + 1} / 3</p>
          <button
            type="button"
            onClick={finishOnboarding}
            className="py-3 text-sm font-semibold text-ink-foreground/80 hover:text-ink-foreground transition-colors"
          >
            O'tkazib yuborish
          </button>
        </div>

        <div
          key={i}
          className="mt-auto flex flex-col items-start pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <h1 className="font-display text-4xl font-extrabold text-ink-foreground">
            <span className="text-primary">Dastyor</span> Food
          </h1>
          <h2 className="mt-4 max-w-80 font-display text-2xl font-bold leading-snug text-ink-foreground">
            {step.title}
          </h2>
          <p className="mt-3 max-w-80 text-sm leading-relaxed text-ink-foreground/80">
            {step.text}
          </p>
        </div>

        <div className="pb-safe mt-7 w-full shrink-0">
          {last ? (
            <Button
              variant="unstyled"
              size="unset"
              onClick={finishOnboarding}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta active:scale-[0.98]"
            >
              Boshlash <ArrowRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="unstyled"
              size="unset"
              onClick={() => setI(i + 1)}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta active:scale-[0.98]"
            >
              Keyingi <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
