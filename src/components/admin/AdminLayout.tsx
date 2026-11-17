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
  Store as StoreIcon,
  Menu,
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { seedFirestoreData } from "@/lib/firebase-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuGroups = [
  {
    id: "main",
    title: "Asosiy",
    items: [
      { to: "/admin", label: "Statistika", icon: LayoutDashboard },
      { to: "/admin/orders", label: "Buyurtmalar", icon: ShoppingBag },
    ],
  },
  {
    id: "catalog",
    title: "Katalog & Marketing",
    items: [
      { to: "/admin/products", label: "Taomlar", icon: UtensilsCrossed },
      { to: "/admin/restaurants", label: "Restoranlar", icon: Store },
      { to: "/admin/categories", label: "Kategoriyalar", icon: Layers },
      { to: "/admin/banners", label: "Bannerlar", icon: ImageIcon },
    ],
  },
  {
    id: "system",
    title: "Tizim",
    items: [
      { to: "/admin/settings", label: "Sozlamalar", icon: Settings },
    ],
  },
] as const;

const allNavItems = menuGroups.flatMap((g) => g.items);

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Auto close mobile drawer on route navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSeed = async () => {
    if (!isFirebaseConfigured) {
      toast.error("Firebase sozlamalari topilmadi", {
        description: ".env fayliga Firebase kalitlarini kiriting.",
      });
      return;
    }

    try {
      setIsSeeding(true);
      const res = await seedFirestoreData();
      if (res.success) {
        toast.success("Baza muvaffaqiyatli to'ldirildi!", {
          description: `${res.restaurantsCount} ta xona, ${res.productsCount} ta taom va ${res.categoriesCount} ta toifa yuklandi.`,
        });
      } else {
        toast.error("Xatolik", { description: res.message });
      }
    } catch {
      toast.error("Sinxronizatsiyada xatolik yuz berdi");
    } finally {
      setIsSeeding(false);
    }
  };

  // Find active navigation item for header
  const activeItem =
    allNavItems.find((item) =>
      item.to === "/admin"
        ? location.pathname === "/admin" || location.pathname === "/admin/"
        : location.pathname.startsWith(item.to),
    ) || allNavItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-background font-sans antialiased overflow-hidden select-none">
      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Navigation (Desktop Static, Mobile Slide-Over Drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-card border-r border-border text-foreground transform transition-transform duration-300 md:translate-x-0 md:static shrink-0 shadow-lg md:shadow-xs",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand / Logo Header in Sidebar */}
        <div className="p-4 flex items-center justify-between border-b border-border/70">
          <Link to="/admin" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary to-orange-500 flex items-center justify-center text-primary-foreground font-display font-black text-sm shadow-md shadow-primary/20 shrink-0">
              D
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display font-extrabold text-sm text-foreground truncate leading-tight tracking-tight">
                Dastyor Food
              </h2>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider block mt-0.5">
                Boshqaruv Paneli
              </span>
            </div>
          </Link>

          {/* Mobile close sidebar button */}
          <Button
            variant="unstyled"
            size="unset"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Grouped Menu Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto no-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 block select-none">
                {group.title}
              </span>
              {group.items.map((item) => {
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
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-black"
                        : "text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-primary-foreground" : "text-muted-foreground",
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Status and Seed Button */}
        <div className="p-3 border-t border-border/70 flex flex-col gap-2 bg-muted/20">
          <div className="flex items-center justify-between px-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isFirebaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500",
                )}
              />
              <span className="font-bold text-muted-foreground">
                {isFirebaseConfigured ? "Firebase Ulandi" : "Lokal Rejim"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">v1.2</span>
          </div>

          {isFirebaseConfigured && (
            <Button
              variant="unstyled"
              size="unset"
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-[11px] font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSeeding && "animate-spin")} />
              <span>{isSeeding ? "Yuklanmoqda..." : "Bazani sinxronlash"}</span>
            </Button>
          )}
        </div>
      </aside>

      {/* Main Area Container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navbar Header */}
        <header className="h-14 border-b border-border bg-card/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-2xs z-30">
          {/* Left: Active Tab Icon Badge + Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-2xs shrink-0">
              <ActiveIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h1 className="font-display font-extrabold text-foreground text-xs sm:text-sm uppercase tracking-wide truncate">
              {activeItem.label}
            </h1>
          </div>

          {/* Right: Return to Store & Profile Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link
              to="/home"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary active:scale-95 font-bold text-xs rounded-xl transition-all border border-primary/20 shadow-2xs"
              title="Mijoz ilovasiga qaytish"
            >
              <StoreIcon className="w-4 h-4 shrink-0 stroke-[2.2]" />
              <span className="hidden sm:inline">Saytga qaytish</span>
            </Link>

            <div className="flex items-center gap-2 border-l pl-2 sm:pl-3 border-border">
              <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display font-black text-xs shadow-sm shadow-primary/20">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content View Container with padding-bottom for mobile bottom bar */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#F8FAFC] dark:bg-background">
          <div className="max-w-6xl mx-auto pb-24 md:pb-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (Exact online store pattern for quick thumb access) */}
        <nav
          aria-label="Admin mobil menyusi"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around shadow-lg"
        >
          <Link
            to="/admin"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all",
              location.pathname === "/admin" || location.pathname === "/admin/"
                ? "text-primary font-black scale-105"
                : "text-muted-foreground font-medium",
            )}
          >
            <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Statistika</span>
          </Link>

          <Link
            to="/admin/orders"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all",
              location.pathname.startsWith("/admin/orders")
                ? "text-primary font-black scale-105"
                : "text-muted-foreground font-medium",
            )}
          >
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Buyurtmalar</span>
          </Link>

          <Link
            to="/admin/products"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all",
              location.pathname.startsWith("/admin/products")
                ? "text-primary font-black scale-105"
                : "text-muted-foreground font-medium",
            )}
          >
            <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Taomlar</span>
          </Link>

          <Link
            to="/admin/restaurants"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all",
              location.pathname.startsWith("/admin/restaurants")
                ? "text-primary font-black scale-105"
                : "text-muted-foreground font-medium",
            )}
          >
            <Store className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Xonalar</span>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-muted-foreground font-medium hover:text-primary active:scale-95 transition-all"
            aria-label="Barcha menyuni ochish"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Barchasi</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
