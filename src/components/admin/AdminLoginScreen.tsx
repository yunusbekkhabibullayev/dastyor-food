import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminLoginScreenProps {
  onLoginSuccess?: (token: string, remember: boolean) => void;
  onCancel?: () => void;
}

export function AdminLoginScreen({ onLoginSuccess, onCancel }: AdminLoginScreenProps) {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"uz" | "ru" | "en">("uz");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Field validation flags
  const [loginTouched, setLoginTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isLoginValid = login.trim().length >= 3;
  const isPasswordValid = password.length >= 4;

  const toggleLanguage = () => {
    const next = lang === "uz" ? "ru" : lang === "ru" ? "en" : "uz";
    setLang(next);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate({ to: "/home" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginTouched(true);
    setPasswordTouched(true);

    // Validation checks matching reference
    if (!login.trim() || !password.trim()) {
      setError(
        lang === "uz"
          ? "Iltimos, login va parolni kiriting!"
          : lang === "ru"
            ? "Пожалуйста, заполните все поля!"
            : "Please enter login and password!",
      );
      return;
    }

    if (!isLoginValid) {
      setError(
        lang === "uz"
          ? "Login kamida 3 ta belgidan iborat bo'lishi kerak!"
          : lang === "ru"
            ? "Логин должен содержать минимум 3 символа!"
            : "Login must be at least 3 characters!",
      );
      return;
    }

    if (!isPasswordValid) {
      setError(
        lang === "uz"
          ? "Parol kamida 4 ta belgidan iborat bo'lishi kerak!"
          : lang === "ru"
            ? "Пароль должен содержать минимум 4 символа!"
            : "Password must be at least 4 characters!",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await new Promise((r) => setTimeout(r, 600));

      const token = `dastyor_admin_token_${Date.now()}`;
      if (rememberMe) {
        localStorage.setItem("dastyor_admin_token", token);
        localStorage.setItem("dastyor_admin_user", JSON.stringify({ name: login.trim(), role: "super_admin" }));
      } else {
        sessionStorage.setItem("dastyor_admin_token", token);
        sessionStorage.setItem("dastyor_admin_user", JSON.stringify({ name: login.trim(), role: "super_admin" }));
      }

      toast.success(
        lang === "uz"
          ? "Tizimga muvaffaqiyatli kirildi! 👋"
          : lang === "ru"
            ? "Успешный вход в систему! 👋"
            : "Successfully signed in! 👋",
      );

      if (onLoginSuccess) {
        onLoginSuccess(token, rememberMe);
      } else {
        navigate({ to: "/admin" });
      }
    } catch {
      setError(
        lang === "uz"
          ? "Ulanish xatoligi yuz berdi."
          : lang === "ru"
            ? "Ошибка соединения."
            : "Connection error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f8fafc] via-primary/10 to-[#f5f3ff] flex flex-col justify-center items-center px-4 font-sans relative select-none">
      {/* Mesh gradient decorative bubbles */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl -z-10" />

      {/* Main Glass Card (Exact 1:1 match with C:\Users\yunus\Desktop\online store\src\App.jsx) */}
      <div className="w-full max-w-sm bg-white/70 backdrop-blur-md p-8 rounded-[32px] border border-white/60 shadow-[0_20px_50px_rgba(59,130,246,0.05)] flex flex-col text-center transition-all animate-scaleUp">
        {/* Header Icon badge (Project primary color instead of red) */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 border border-primary/20 shadow-sm shrink-0">
          <Lock className="w-6 h-6 text-primary animate-pulse" />
        </div>

        <h2 className="text-[20px] font-black text-gray-900 tracking-tight mb-1">
          {lang === "uz" ? "Tizimga kirish" : lang === "ru" ? "Вход в систему" : "Admin Sign In"}
        </h2>
        <p className="text-[10px] text-primary font-extrabold tracking-wider uppercase mb-7">
          Dastyor Food Manager
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Login / Email input field */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-600 tracking-wider block mb-1.5 pl-1">
              {lang === "uz" ? "Login yoki Email" : lang === "ru" ? "Логин или Email" : "Login or Email"}
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={login}
                onBlur={() => setLoginTouched(true)}
                onChange={(e) => {
                  setLogin(e.target.value);
                  setError("");
                }}
                placeholder="masalan: admin yoki xodim_login"
                style={{ fontSize: "12px", lineHeight: "1.2" }}
                className={cn(
                  "w-full h-9 bg-gray-50/50 border pl-8.5 pr-3.5 py-1.5 rounded-xl text-xs font-normal text-gray-800 focus:outline-none focus:ring-2 transition-all placeholder:text-[11px] placeholder:font-normal placeholder:text-gray-400",
                  loginTouched && !isLoginValid
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/30"
                    : "border-gray-200/80 focus:border-primary focus:ring-primary/10 focus:bg-white",
                )}
              />
            </div>
          </div>

          {/* Password input field */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-600 tracking-wider block mb-1.5 pl-1">
              {lang === "uz" ? "Maxfiy parol" : lang === "ru" ? "Секретный пароль" : "Password"}
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onBlur={() => setPasswordTouched(true)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                style={{ fontSize: "12px", lineHeight: "1.2" }}
                className={cn(
                  "w-full h-9 bg-gray-50/50 border pl-8.5 pr-9 py-1.5 rounded-xl text-xs font-normal text-gray-800 focus:outline-none focus:ring-2 transition-all placeholder:text-[11px] placeholder:font-normal placeholder:text-gray-400",
                  passwordTouched && !isPasswordValid
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/30"
                    : "border-gray-200/80 focus:border-primary focus:ring-primary/10 focus:bg-white",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5 shrink-0" /> : <Eye className="w-3.5 h-3.5 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center pl-1 pt-0.5 select-none text-[11px] font-semibold text-gray-500">
            <label className="flex items-center gap-2 cursor-pointer active:scale-98 transition-transform">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary bg-gray-50/30 rounded-md border-gray-200 focus:ring-primary focus:ring-offset-0 focus:outline-none cursor-pointer"
              />
              <span>{lang === "uz" ? "Eslab qolish" : lang === "ru" ? "Запомнить" : "Remember me"}</span>
            </label>
          </div>

          {/* Error warning badge */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] font-bold text-rose-600 text-center animate-shake">
              ⚠️ {error}
            </div>
          )}

          {/* Submit button with loader (Project primary color) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:opacity-90 active:scale-95 text-primary-foreground font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3.5 cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{lang === "uz" ? "Kirilmoqda..." : lang === "ru" ? "Вход..." : "Signing in..."}</span>
              </div>
            ) : (
              <span>{lang === "uz" ? "Kirish" : lang === "ru" ? "Войти" : "Sign In"}</span>
            )}
          </button>
        </form>
      </div>

      {/* Return to store button matching online store */}
      <button
        type="button"
        onClick={handleCancel}
        className="mt-6 text-gray-500 hover:text-gray-900 text-xs font-bold transition-colors active:scale-95 py-2 px-4 rounded-xl hover:bg-gray-100 cursor-pointer"
      >
        {lang === "uz" ? "Do'konga qaytish" : lang === "ru" ? "Вернуться в магазин" : "Back to store"}
      </button>
    </div>
  );
}
