import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Layers,
  Image as ImageIcon,
  Settings,
  Store,
  Menu,
  X,
  ChevronDown,
  RefreshCw,
  LogOut,
  User,
  ShieldCheck,
  Store as StoreIcon,
} from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { seedFirestoreData } from "@/lib/firebase-data";
import { LanguageFlag } from "@/components/ui/FlagIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<"uz" | "ru" | "en">("uz");

  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSeed = async () => {
    if (!isFirebaseConfigured) {
      toast.error("Firebase sozlanmagan! .env.local faylini tekshiring.");
      return;
    }
    setIsSeeding(true);
    try {
      const res = await seedFirestoreData();
      toast.success(
        `Firebase muvaffaqiyatli sinxronlandi! (${res.restaurants} restoran, ${res.products} taom, ${res.categories} kategoriya)`,
      );
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = () => {
    toast.info("Tizimdan chiqildi");
    navigate({ to: "/home" });
  };

  const selectLanguage = (l: "uz" | "ru" | "en") => {
    setCurrentLang(l);
    setLangDropdownOpen(false);
    toast.info(`Til tanlandi: ${l === "uz" ? "O'zbekcha" : l === "ru" ? "Русский" : "English"}`);
  };

  const toggleLanguage = () => {
    const nextLang = currentLang === "uz" ? "ru" : currentLang === "ru" ? "en" : "uz";
    setCurrentLang(nextLang);
    toast.info(`Til: ${nextLang === "uz" ? "O'zbekcha" : nextLang === "ru" ? "Русский" : "English"}`);
  };

  const menuGroups = [
    {
      id: "main",
      title: "Asosiy",
      items: [
        { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin/orders", label: "Buyurtmalar", icon: ShoppingBag },
      ],
    },
    {
      id: "catalog",
      title: "Menyu & Oshxonalar",
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
      items: [{ to: "/admin/settings", label: "Sozlamalar", icon: Settings }],
    },
  ];

  const allItems = menuGroups.flatMap((g) => g.items);
  const activeItem =
    allItems.find((i) =>
      i.to === "/admin"
        ? location.pathname === "/admin" || location.pathname === "/admin/"
        : location.pathname.startsWith(i.to),
    ) || allItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-gray-800 antialiased font-sans">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Brand Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-150 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 shadow-xs",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Store Brand / Logo Header in Sidebar */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <Link
            to="/admin"
            className="flex items-center gap-3 min-w-0"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-9 h-9 rounded-2xl bg-[#CC1122] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-[#CC1122]/30">
              D
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <h2 className="font-extrabold text-xs text-gray-900 truncate leading-tight tracking-tight">
                Dastyor Food
              </h2>
              <span className="text-[10px] text-[#CC1122] font-black uppercase tracking-wider block mt-0.5">
                Admin Panel
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Links */}
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
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer",
                      isActive
                        ? "bg-[#CC1122] text-white shadow-md shadow-[#CC1122]/20 font-black"
                        : "text-gray-600 hover:text-gray-900 hover:bg-[#FFF0F1]/50 hover:text-[#CC1122]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 stroke-[2.2]",
                        isActive ? "text-white" : "text-gray-500",
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Minimal Sidebar Footer */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-gray-500 bg-gray-50/50">
          <div className="flex items-center gap-2 pl-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isFirebaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500",
              )}
            />
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
            title="Sozlamalar"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Area Container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ─── Top Navbar Header (Clean & pixel-perfect matching reference) ─── */}
        <header className="h-14 border-b border-gray-150 bg-white flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-2xs z-30">
          {/* Left: Mobile Drawer Trigger + Active Tab Icon Badge & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer -ml-1"
              aria-label="Menyu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Active Tab Icon Badge */}
            <div className="w-8 h-8 rounded-xl bg-[#FFF0F1] text-[#CC1122] flex items-center justify-center border border-[#FFE4E6] shadow-2xs shrink-0">
              <ActiveIcon className="w-4 h-4 stroke-[2.2]" />
            </div>

            {/* Title */}
            <h1 className="font-black text-gray-900 text-xs sm:text-sm uppercase tracking-wide truncate">
              {activeItem.label}
            </h1>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Saytga qaytish Button */}
            <Link
              to="/home"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF0F1] hover:bg-[#ffe4e6] text-[#CC1122] active:scale-95 font-black text-xs rounded-xl transition-all border border-[#FFE4E6] cursor-pointer shadow-2xs"
              title="Saytga o'tish"
            >
              <StoreIcon className="w-4 h-4 text-[#CC1122] shrink-0 stroke-[2.2]" />
              <span className="hidden sm:inline">Saytga qaytish</span>
            </Link>

            {/* Visual SVG Country Flag Switcher (Boxless exactly matching reference) */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen((prev) => !prev)}
                className="p-1 hover:opacity-85 active:scale-95 transition-all cursor-pointer select-none flex items-center justify-center rounded-md"
                title={currentLang === "uz" ? "O'zbekcha" : currentLang === "ru" ? "Русский" : "English"}
              >
                <LanguageFlag
                  lang={currentLang}
                  className="w-6 h-4 object-cover shadow-2xs rounded-xs border border-gray-200/90"
                />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-xl border border-gray-150 py-1.5 z-50 animate-scaleUp text-left">
                  <div className="px-3 py-1 border-b border-gray-100 text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                    Tilni tanlang:
                  </div>
                  <div className="p-1 space-y-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => selectLanguage("uz")}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer",
                        currentLang === "uz" ? "bg-[#FFF0F1] text-[#CC1122] font-black" : "text-gray-700 hover:bg-gray-100",
                      )}
                    >
                      <LanguageFlag lang="uz" className="w-5 h-3.5 object-cover rounded-xs border border-gray-200" />
                      <span>O'zbekcha</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectLanguage("ru")}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer",
                        currentLang === "ru" ? "bg-[#FFF0F1] text-[#CC1122] font-black" : "text-gray-700 hover:bg-gray-100",
                      )}
                    >
                      <LanguageFlag lang="ru" className="w-5 h-3.5 object-cover rounded-xs border border-gray-200" />
                      <span>Русский</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectLanguage("en")}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer",
                        currentLang === "en" ? "bg-[#FFF0F1] text-[#CC1122] font-black" : "text-gray-700 hover:bg-gray-100",
                      )}
                    >
                      <LanguageFlag lang="en" className="w-5 h-3.5 object-cover rounded-xs border border-gray-200" />
                      <span>English</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown Trigger */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 border-l pl-2 sm:pl-3 border-gray-150 hover:bg-gray-50 py-1 px-1.5 sm:px-2 rounded-2xl transition-all cursor-pointer select-none"
              >
                <div className="w-8 h-8 rounded-2xl bg-[#CC1122] text-white flex items-center justify-center font-black text-xs shadow-sm shadow-[#CC1122]/20">
                  A
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-black text-gray-900 leading-tight flex items-center gap-1 truncate max-w-[120px]">
                    Admin
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 text-gray-400 transition-transform duration-200",
                        profileDropdownOpen && "rotate-180",
                      )}
                    />
                  </span>
                  <span className="text-[10px] text-[#CC1122] font-black uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-[#CC1122] shrink-0 stroke-[2.2]" />
                    <span>Super Admin</span>
                  </span>
                </div>
              </button>

              {/* Profile Dropdown Popup Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-xl border border-gray-150 py-1.5 z-50 animate-scaleUp text-left">
                  <div className="px-4 py-3 border-b border-gray-100 bg-[#FFF0F1]/40 rounded-t-3xl">
                    <p className="text-xs font-black text-gray-900 truncate">Admin Yunusbek</p>
                    <p className="text-[10px] font-black text-[#CC1122] mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#CC1122] shrink-0 stroke-[2.2]" />
                      <span>Super Admin</span>
                    </p>
                  </div>

                  <div className="p-1.5 space-y-0.5 text-xs">
                    <Link
                      to="/admin/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-[#FFF0F1] hover:text-[#CC1122] font-bold transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#CC1122] shrink-0" />
                      <span>Profil & Sozlamalar</span>
                    </Link>

                    {isFirebaseConfigured && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleSeed();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-[#FFF0F1] hover:text-[#CC1122] font-bold transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-[#CC1122] shrink-0" />
                        <span>Bazani sinxronlash</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-gray-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Tizimdan chiqish</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto pb-24 md:pb-12">{children}</div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
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
            <span className="text-[10px]">Taomlar</span>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-gray-500 font-medium hover:text-gray-900 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px]">Menyu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
