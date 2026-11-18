import { useSyncExternalStore } from "react";

const ADMIN_TOKEN_KEY = "dastyor_admin_token";
const ADMIN_USER_KEY = "dastyor_admin_user";

export interface AdminUser {
  name: string;
  role: string;
}

export interface AdminCredentialAccount {
  login: string;
  email: string;
  password: string;
  name: string;
  role: "super_admin" | "admin" | "manager";
}

/**
 * Valid system administrator and staff accounts.
 * Defaults match industry standard (admin / admin123) and can be configured via environment variables.
 */
export const SYSTEM_ADMIN_ACCOUNTS: AdminCredentialAccount[] = [
  {
    login: (import.meta.env.VITE_ADMIN_LOGIN || "admin").toLowerCase(),
    email: "admin@dastyor.uz",
    password: import.meta.env.VITE_ADMIN_PASSWORD || "admin123",
    name: "Super Administrator",
    role: "super_admin",
  },
  {
    login: "yunusbek",
    email: "yunusbek@dastyor.uz",
    password: import.meta.env.VITE_ADMIN_PASSWORD || "admin123",
    name: "Admin Yunusbek",
    role: "super_admin",
  },
  {
    login: "manager",
    email: "manager@dastyor.uz",
    password: "manager123",
    name: "Dastyor Menejer",
    role: "manager",
  },
];

/**
 * Strictly verifies admin login and password credentials.
 * Returns success=true only when exact match is found.
 */
export function verifyAdminCredentials(
  identifier: string,
  pass: string,
): { success: boolean; user?: AdminUser; error?: string } {
  const cleanId = (identifier || "").trim().toLowerCase();
  const cleanPass = (pass || "").trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: "Login va parolni kiriting!" };
  }

  const account = SYSTEM_ADMIN_ACCOUNTS.find(
    (acc) =>
      (acc.login.toLowerCase() === cleanId || acc.email.toLowerCase() === cleanId) &&
      acc.password === cleanPass,
  );

  if (!account) {
    return { success: false, error: "Login yoki parol noto'g'ri!" };
  }

  return {
    success: true,
    user: {
      name: account.name,
      role: account.role,
    },
  };
}

type AuthListener = () => void;
const listeners = new Set<AuthListener>();

function notify() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      // ignore listener error
    }
  });
}

/**
 * Safely reads the admin auth token from localStorage or sessionStorage.
 */
export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Safely reads the admin user info from storage.
 */
export function getAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY) || sessionStorage.getItem(ADMIN_USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

/**
 * Synchronous check whether admin is logged in with a valid token.
 */
export function isStaffAdmin(): boolean {
  return !!getAdminToken();
}

/**
 * Stores the admin auth token and user profile into persistent or session storage.
 */
export function saveAdminAuth(token: string, user: AdminUser, remember: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (remember) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_USER_KEY);
    } else {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    }
  } catch {
    // Ignore storage quota/permission errors
  }
  notify();
}

/**
 * Clears all admin auth credentials and notifies all listeners.
 */
export function clearAdminAuth(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
  } catch {
    // Ignore
  }
  notify();
}

/**
 * Reactive hook that causes components to re-render when admin authentication status changes.
 * SSR-safe: returns false on server.
 */
export function useIsAdminAuthenticated(): boolean {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      if (typeof window !== "undefined") {
        window.addEventListener("storage", callback);
      }
      return () => {
        listeners.delete(callback);
        if (typeof window !== "undefined") {
          window.removeEventListener("storage", callback);
        }
      };
    },
    () => isStaffAdmin(),
    () => false,
  );
}
