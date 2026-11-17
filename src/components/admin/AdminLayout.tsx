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
  RefreshCw,
  UserCircle,
} from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { seedFirestoreData } from "@/lib/firebase-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      { to: "/admin/products", label: "Mahsulotlar", icon: UtensilsCrossed },
      { to: "/admin/restaurants", label: "Xonalar", icon: Store },
      { to: "/admin/categories", label: "Kategoriyalar", icon: Layers },
      { to: "/admin/banners", label: "Bannerlar", icon: ImageIcon },
    ],
  },
  {
    id: "system",
    title: "Sozlamalar",
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
    <div className="flex h-screen bg-[#F8FAFC] font-sans antialiased overflow-hidden select-none">
      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Navigation (Clean Brand White Theme matching online store reference) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-60 bg-white border-r border-gray-150 text-gray-900 transform transition-transform duration-300 md:translate-x-0 md:static shrink-0 shadow-sm",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Store Brand / Logo Header in Sidebar */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <Link to="/admin" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#CC1122] to-[#ff4d5e] flex items-center justify-center text-white font-black text-sm shadow-md shadow-[#CC1122]/20 shrink-0">
              D
            </div>
            <div className="min-w-0 flex-1 text-left">
              <h2 className="font-extrabold text-xs text-gray-900 truncate leading-tight tracking-tight">
                Dastyor Food
              </h2>
              <span className="text-[10px] text-[#CC1122] font-black uppercase tracking-wider block mt-0.5">
                Do'kon boshqaruvi
              </span>
            </div>
          </Link>

          {/* Mobile close sidebar button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Links grouped by functional sections */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto no-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-gray-400 block select-none text-left">
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
                        ? "bg-[#CC1122] text-white shadow-md shadow-[#CC1122]/20 font-black"
                        : "text-gray-600 hover:text-gray-900 hover:bg-[#FFF0F1]/50 hover:text-[#CC1122]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-[#CC1122]",
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Clean Minimal Sidebar Footer */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-gray-500 bg-gray-50/50">
          <div className="flex items-center gap-2 pl-2">
            <div className={cn("w-2 h-2 rounded-full", isFirebaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
            <span className="text-[10px] font-bold text-gray-500">
              {isFirebaseConfigured ? "Firebase Faol" : "Dastyor v2.1.43"}
            </span>
          </div>

          {isFirebaseConfigured && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={isSeeding}
              className="p-1.5 hover:bg-[#FFF0F1] text-gray-400 hover:text-[#CC1122] rounded-xl transition-colors cursor-pointer"
              title="Bazani sinxronlash"
            >
              <RefreshCw className={cn("w-4 h-4", isSeeding && "animate-spin text-[#CC1122]")} />
            </button>
          )}

          <Link
            to="/admin/settings"
            className="p-1.5 hover:bg-[#FFF0F1] text-gray-400 hover:text-[#CC1122] rounded-xl transition-colors cursor-pointer"
            title="Profil & Sozlamalar"
          >
            <UserCircle className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Area Container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navbar Header (h-14 border-b border-gray-150 bg-white) */}
        <header className="h-14 border-b border-gray-150 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-2xs z-30">
          {/* Active Tab Icon Badge + Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0F1] text-[#CC1122] flex items-center justify-center border border-[#FFE4E6] shadow-2xs shrink-0">
              <ActiveIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h1 className="font-black text-gray-900 text-xs sm:text-sm uppercase tracking-wide truncate">
              {activeItem.label}
            </h1>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Saytga qaytish Button */}
            <Link
              to="/home"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF0F1] hover:bg-[#ffe4e6] text-[#CC1122] active:scale-95 font-black text-xs rounded-xl transition-all border border-[#FFE4E6] cursor-pointer shadow-2xs"
              title="Saytga o'tish"
            >
              <StoreIcon className="w-4 h-4 text-[#CC1122] shrink-0 stroke-[2.2]" />
              <span className="hidden sm:inline">Saytga qaytish</span>
            </Link>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 border-l pl-2 sm:pl-3 border-gray-150">
              <div className="w-8 h-8 rounded-2xl bg-[#CC1122] text-white flex items-center justify-center font-black text-xs shadow-sm shadow-[#CC1122]/20">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content View Container with padding-bottom for mobile bottom bar */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto pb-24 md:pb-12">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (exact quick thumb access matching reference) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-150 px-2 py-1.5 flex items-center justify-around shadow-lg">
          <Link
            to="/admin"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all",
              location.pathname === "/admin" || location.pathname === "/admin/"
                ? "text-[#CC1122] font-black scale-105"
                : "text-gray-500 font-medium",
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
                ? "text-[#CC1122] font-black scale-105"
                : "text-gray-500 font-medium",
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
                ? "text-[#CC1122] font-black scale-105"
                : "text-gray-500 font-medium",
            )}
          >
            <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Tovarlar</span>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-gray-500 font-medium hover:text-[#CC1122] active:scale-95 transition-all cursor-pointer"
            aria-label="Menyu"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Menyu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
