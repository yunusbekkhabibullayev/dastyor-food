import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin Kirish — Dastyor Food" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();

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

