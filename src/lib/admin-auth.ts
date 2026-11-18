import { useSyncExternalStore } from "react";

const ADMIN_TOKEN_KEY = "dastyor_admin_token";
const ADMIN_USER_KEY = "dastyor_admin_user";

export interface AdminUser {
  name: string;
  role: string;
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
