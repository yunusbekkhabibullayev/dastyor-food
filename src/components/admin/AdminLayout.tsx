import { Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Store,
  Layers,
  Image as ImageIcon,
  Settings,
  ArrowLeft,
  Menu,
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { seedFirestoreData } from "@/lib/firebase-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Buyurtmalar", icon: ShoppingBag },
  { to: "/admin/products", label: "Taomlar", icon: UtensilsCrossed },
  { to: "/admin/restaurants", label: "Restoranlar", icon: Store },
  { to: "/admin/categories", label: "Kategoriyalar", icon: Layers },
  { to: "/admin/banners", label: "Bannerlar", icon: ImageIcon },
  { to: "/admin/settings", label: "Sozlamalar", icon: Settings },
] as const;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Auto close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSeed = async () => {
    if (!isFirebaseConfigured) {
      toast.error("Firebase sozlamalari topilmadi", {
        description: ".env fayliga Firebase API kalitlarini kiritish lozim.",
      });
      return;
    }

    try {
      setIsSeeding(true);
      const res = await seedFirestoreData();
      if (res.success) {
        toast.success("Baza muvaffaqiyatli to'ldirildi!", {
          description: `${res.restaurantsCount} ta restoran, ${res.productsCount} ta taom va ${res.categoriesCount} ta kategoriya yuklandi.`,
        });
      } else {
        toast.error("Xatolik yuz berdi", { description: res.message });
      }
    } catch (err) {
      toast.error("Sinxronizatsiyada xatolik yuz berdi");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 text-foreground font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 md:px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="unstyled"
            size="unset"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border md:hidden text-foreground"
            aria-label="Menyuni ochish"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-black text-lg shadow-sm">
              D
            </div>
            <div className="leading-tight">
              <span className="font-display font-extrabold text-base tracking-tight block">
                <span className="text-primary">Dastyor</span> Food
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Boshqaruv Paneli
              </span>
            </div>
          </Link>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Firebase Connection Status Pill */}
          <div
            className={cn(
              "hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
              isFirebaseConfigured
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            )}
          >
            {isFirebaseConfigured ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Firebase Faol</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Lokal Rejim</span>
              </>
            )}
          </div>

          {/* Sync Button */}
          {isFirebaseConfigured && (
            <Button
              variant="unstyled"
              size="unset"
              onClick={handleSeed}
              disabled={isSeeding}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSeeding && "animate-spin")} />
              {isSeeding ? "Yuklanmoqda..." : "Bazani sinxronlash"}
            </Button>
          )}

          {/* Return to App */}
          <Link
            to="/home"
            className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ilovaga qaytish</span>
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col justify-between border-r border-border bg-card p-4">
          <nav className="space-y-1.5">
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Asosiy Menyu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === "/admin"
                  ? location.pathname === "/admin" || location.pathname === "/admin/"
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="rounded-2xl border border-border/70 bg-muted/40 p-3.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground mb-1">
              <Database className="h-3.5 w-3.5 text-primary" />
              <span>Baza Holati</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isFirebaseConfigured
                ? "Firestore bulutli bazasiga ulangan."
                : ".env orqali Firebase ulanganda real vaqtli sinxronizatsiya yoqiladi."}
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <aside
              className="h-full w-72 bg-card p-5 shadow-2xl animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <span className="font-display font-extrabold text-base">Menyu</span>
                <Button
                  variant="unstyled"
                  size="unset"
                  onClick={() => setMobileMenuOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.to === "/admin"
                      ? location.pathname === "/admin" || location.pathname === "/admin/"
                      : location.pathname.startsWith(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {isFirebaseConfigured && (
                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    variant="unstyled"
                    size="unset"
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-xs font-bold text-foreground"
                  >
                    <RefreshCw className={cn("h-4 w-4", isSeeding && "animate-spin")} />
                    {isSeeding ? "Yuklanmoqda..." : "Bazani sinxronlash"}
                  </Button>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

