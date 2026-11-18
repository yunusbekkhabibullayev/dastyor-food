import { useEffect } from "react";
import { createFileRoute, useNavigate, useHydrated } from "@tanstack/react-router";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { useIsAdminAuthenticated } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin Kirish — Dastyor Food" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const isHydrated = useHydrated();
  const isAuthenticated = useIsAdminAuthenticated();

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      navigate({ to: "/admin", replace: true });
    }
  }, [isHydrated, isAuthenticated, navigate]);

  return (
    <AdminLoginScreen
      onLoginSuccess={() => {
        navigate({ to: "/admin" });
      }}
      onCancel={() => {
        navigate({ to: "/home" });
      }}
    />
  );
}

