import React, { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Store,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { LanguageFlag } from "@/components/ui/FlagIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminLoginScreenProps {
  onLoginSuccess?: (token: string, remember: boolean) => void;
  onCancel?: () => void;
}

export function AdminLoginScreen({ onLoginSuccess, onCancel }: AdminLoginScreenProps) {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"uz" | "ru" | "en">("uz");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const [loginTouched, setLoginTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isLoginValid = login.trim().length >= 3;
  const isPasswordValid = password.length >= 4;

  const t = {
    uz: {
      title: "Tizimga kirish",
      subtitle: "Dastyor Food Boshqaruv Markazi",
      loginLabel: "Login yoki Email",
      loginPlaceholder: "masalan: admin yoki info@dastyor.uz",
      passwordLabel: "Maxfiy parol",
      passwordPlaceholder: "••••••••",
      rememberMe: "Eslab qolish",
      submitBtn: "Kirish",
      submitting: "Kirilmoqda...",
      backToStore: "Saytga qaytish",
      emptyFields: "Iltimos, login va parolni kiriting!",
      loginTooShort: "Login kamida 3 ta belgidan iborat bo'lishi kerak!",
      passwordTooShort: "Parol kamida 4 ta belgidan iborat bo'lishi kerak!",
      loginSuccess: "Tizimga muvaffaqiyatli kirildi! 👋",
      demoHint: "Demo kirish uchun: login 'admin', parol 'admin123'",
    },
    ru: {
      title: "Вход в систему",
      subtitle: "Центр управления Dastyor Food",
      loginLabel: "Логин или Email",
      loginPlaceholder: "например: admin или info@dastyor.uz",
      passwordLabel: "Секретный пароль",
      passwordPlaceholder: "••••••••",
      rememberMe: "Запомнить",
      submitBtn: "Войти",
      submitting: "Вход...",
      backToStore: "Вернуться на сайт",
      emptyFields: "Пожалуйста, заполните все поля!",
      loginTooShort: "Логин должен содержать минимум 3 символа!",
      passwordTooShort: "Пароль должен содержать минимум 4 символа!",
      loginSuccess: "Успешный вход в систему! 👋",
      demoHint: "Для демо входа: логин 'admin', пароль 'admin123'",
    },
    en: {
      title: "Admin Sign In",
      subtitle: "Dastyor Food Control Hub",
      loginLabel: "Login or Email",
      loginPlaceholder: "e.g. admin or info@dastyor.uz",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      rememberMe: "Remember me",
      submitBtn: "Sign In",
      submitting: "Signing in...",
      backToStore: "Back to store",
      emptyFields: "Please enter login and password!",
      loginTooShort: "Login must be at least 3 characters!",
      passwordTooShort: "Password must be at least 4 characters!",
      loginSuccess: "Successfully signed in! 👋",
      demoHint: "Demo credentials: login 'admin', password 'admin123'",
    },
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginTouched(true);
    setPasswordTouched(true);

    if (!login.trim() || !password.trim()) {
      setError(t.emptyFields);
      return;
    }

    if (!isLoginValid) {
      setError(t.loginTooShort);
      return;
    }

    if (!isPasswordValid) {
      setError(t.passwordTooShort);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate / verify admin credentials
      await new Promise((r) => setTimeout(r, 600));

      const token = `dastyor_admin_tok_${Date.now()}`;
      if (rememberMe) {
        localStorage.setItem("dastyor_admin_token", token);
        localStorage.setItem("dastyor_admin_user", JSON.stringify({ name: login.trim(), role: "super_admin" }));
      } else {
        sessionStorage.setItem("dastyor_admin_token", token);
        sessionStorage.setItem("dastyor_admin_user", JSON.stringify({ name: login.trim(), role: "super_admin" }));
      }

      toast.success(t.loginSuccess);

      if (onLoginSuccess) {
        onLoginSuccess(token, rememberMe);
      } else {
        navigate({ to: "/admin" });
      }
    } catch {
      setError("Ulanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setLogin("admin");
    setPassword("admin123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-background via-primary-soft/35 to-background flex flex-col justify-between items-center p-4 sm:p-6 font-sans relative overflow-hidden select-none">
      {/* Decorative Brand Ambient Bubbles (in Primary Color, not red) */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-accent/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header: Brand Logo & Language Switcher */}
      <div className="w-full max-w-sm flex items-center justify-between z-10 pt-2">
        <Link to="/home" className="flex items-center gap-2.5 text-left group">
          <div className="w-9 h-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            D
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-foreground tracking-tight leading-tight">
              Dastyor Food
            </span>
            <span className="text-[10px] text-primary font-bold">
              Boshqaruv
            </span>
          </div>
        </Link>

        {/* Flag Language Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur-xs border border-border rounded-xl text-xs font-bold text-foreground shadow-2xs hover:bg-white active:scale-95 transition-all cursor-pointer"
          >
            <LanguageFlag lang={lang} className="w-4 h-3 rounded-xs border border-border" />
            <span className="uppercase text-[11px] font-extrabold">{lang}</span>
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-2xl shadow-xl border border-border py-1 z-50 animate-scaleUp text-left">
              {(["uz", "ru", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLang(l);
                    setLangDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                    lang === l ? "bg-primary-soft text-primary font-black" : "text-foreground hover:bg-muted",
                  )}
                >
                  <LanguageFlag lang={l} className="w-4 h-3 rounded-xs border border-border" />
                  <span>{l === "uz" ? "O'zbekcha" : l === "ru" ? "Русский" : "English"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Glass Card (Exact Reference Port in Primary Color) */}
      <div className="w-full max-w-sm my-auto py-8 px-6 sm:px-8 bg-white/80 backdrop-blur-md rounded-[32px] border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex flex-col text-center transition-all animate-scaleUp z-10">
        {/* Header Icon Badge (Primary Brand Color) */}
        <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-5 border border-primary/20 shadow-xs shrink-0">
          <Lock className="w-6 h-6 animate-pulse" />
        </div>

        <h2 className="text-[20px] font-black text-foreground tracking-tight mb-1">
          {t.title}
        </h2>
        <p className="text-[10px] text-primary font-extrabold tracking-wider uppercase mb-7">
          {t.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Login / Email Input */}
          <div>
            <label className="text-[11px] font-extrabold text-muted-foreground tracking-wider block mb-1.5 pl-1">
              {t.loginLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={login}
                onBlur={() => setLoginTouched(true)}
                onChange={(e) => {
                  setLogin(e.target.value);
                  setError("");
                }}
                placeholder={t.loginPlaceholder}
                className={cn(
                  "w-full bg-background/50 border pl-10 pr-4 py-3 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-2 transition-all placeholder:text-muted-foreground",
                  loginTouched && !isLoginValid
                    ? "border-destructive/50 focus:border-destructive focus:ring-destructive/10 bg-destructive/5"
                    : "border-border focus:border-primary focus:ring-primary/10 focus:bg-white",
                )}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-[11px] font-extrabold text-muted-foreground tracking-wider block mb-1.5 pl-1">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onBlur={() => setPasswordTouched(true)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder={t.passwordPlaceholder}
                className={cn(
                  "w-full bg-background/50 border pl-10 pr-12 py-3 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:ring-2 transition-all placeholder:text-muted-foreground",
                  passwordTouched && !isPasswordValid
                    ? "border-destructive/50 focus:border-destructive focus:ring-destructive/10 bg-destructive/5"
                    : "border-border focus:border-primary focus:ring-primary/10 focus:bg-white",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Demo Helper */}
          <div className="flex items-center justify-between pl-1 pt-0.5 select-none text-[11px] font-semibold text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary bg-background rounded-md border-border focus:ring-primary focus:ring-offset-0 focus:outline-none cursor-pointer"
              />
              <span>{t.rememberMe}</span>
            </label>

            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-primary hover:underline font-bold text-[10px] cursor-pointer"
            >
              Demo login
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-[11px] font-bold text-destructive text-center flex items-center justify-center gap-1.5 animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button (Primary Brand Color) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3.5 cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t.submitting}</span>
              </div>
            ) : (
              <span>{t.submitBtn}</span>
            )}
          </button>
        </form>

        {/* Demo Hint Banner */}
        <div className="mt-5 p-2.5 rounded-xl bg-primary-soft/60 border border-primary/15 text-[10px] font-medium text-muted-foreground">
          <span className="font-bold text-primary mr-1">Eslatma:</span>
          {t.demoHint}
        </div>
      </div>

      {/* Return to store button */}
      <div className="w-full max-w-sm pt-4 pb-2 z-10 flex items-center justify-center">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-white/60"
          >
            <Store className="w-4 h-4" />
            <span>{t.backToStore}</span>
          </button>
        ) : (
          <Link
            to="/home"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-white/60"
          >
            <Store className="w-4 h-4" />
            <span>{t.backToStore}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
