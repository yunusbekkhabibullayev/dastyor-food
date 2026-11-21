import { createFileRoute, Outlet, useLocation, useNavigate, useHydrated } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { useIsAdminAuthenticated } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHydrated = useHydrated();
  const isAuthenticated = useIsAdminAuthenticated();

  // If on /admin/login, render without sidebar / header
  if (location.pathname === "/admin/login" || location.pathname === "/admin/login/") {
    return <Outlet />;
  }

  // Before hydration, render neutral background to prevent SSR mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-[#f8fafc] via-primary/5 to-[#f5f3ff] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Protected route check: if unauthenticated, show AdminLoginScreen
  if (!isAuthenticated) {
    return (
      <AdminLoginScreen
        onLoginSuccess={() => {
          // Route remains on current location and unlocks immediately
        }}
        onCancel={() => {
          navigate({ to: "/home" });
        }}
      />
    );
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
