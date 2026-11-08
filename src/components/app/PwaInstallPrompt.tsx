import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS navigator standalone
      window.navigator.standalone === true;

    if (isStandalone) {
      return;
    }

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem("dastyor_pwa_dismissed");
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 3 * 24 * 60 * 60 * 1000) {
      // 3 kun davomida qayta bezovta qilmaslik
      return;
    }

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice) {
      setIsIos(true);
      setShowPrompt(true);
      return;
    }

    // Android & Chrome install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    localStorage.setItem("dastyor_pwa_dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-20 z-50 mx-auto max-w-md px-4 animate-in slide-in-from-bottom duration-500">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-card border border-border/80 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/icons/icon-192.png"
              alt="Dastyor Food"
              className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-xs border border-border/40"
            />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground truncate">Dastyor Food ilovasi</h4>
              <p className="text-xs text-muted-foreground truncate">Tez va qulay buyurtma berish</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="unstyled"
              size="unset"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              O'rnatish
            </Button>
            <Button
              variant="unstyled"
              size="unset"
              aria-label="Yopish"
              onClick={handleDismiss}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 backdrop-blur-xs p-4"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Ilovani o'rnatish (iPhone/iPad)</h3>
              <Button
                variant="unstyled"
                size="unset"
                onClick={() => setShowIosGuide(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ol className="space-y-3.5 text-sm text-foreground/90 font-medium">
              <li className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  1
                </span>
                <span>Safari brauzerining pastki qismidagi <b>Ulashish (Share)</b> belgisini bosing.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  2
                </span>
                <span>Ochilgan menyudan <b>"Bosh ekranga qo'shish" (Add to Home Screen)</b> ni tanlang.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  3
                </span>
                <span>Yuqori o'ng burchakdagi <b>"Qo'shish" (Add)</b> tugmasini bosing.</span>
              </li>
            </ol>

            <Button
              variant="unstyled"
              size="unset"
              onClick={() => setShowIosGuide(false)}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-cta"
            >
              Tushunarli
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
