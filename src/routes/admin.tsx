import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const location = useLocation();

  // If on /admin/login, render without sidebar / header
  if (location.pathname === "/admin/login" || location.pathname === "/admin/login/") {
    return <Outlet />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
