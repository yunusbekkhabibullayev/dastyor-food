import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShoppingBag, Phone, MapPin, Search } from "lucide-react";
import { subscribeToFirestoreOrders, updateFirestoreOrderStatus } from "@/lib/firebase-data";
import { isFirebaseConfigured, type OrderDoc } from "@/lib/firebase";
import { cart } from "@/lib/cart-store";
import { formatSom } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [{ title: "Buyurtmalar boshqaruvi — Dastyor Food Admin" }],
  }),
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let unsub = () => {};
    if (isFirebaseConfigured) {
      unsub = subscribeToFirestoreOrders((liveOrders) => setOrders(liveOrders));
    } else {
      const local = cart.get().orders.map((o) => ({
        id: o.id,
        createdAt: o.createdAt,
        restaurantId: o.restaurantId,
        lines: o.lines,
        subtotal: o.subtotal,
        delivery: o.delivery,
        total: o.total,
        status: "new" as const,
        customer: o.customer,
      }));
      setOrders(local);
    }
    return () => unsub();
  }, []);

  const handleStatus = async (id: string, s: OrderDoc["status"]) => {
    if (isFirebaseConfigured) {
      await updateFirestoreOrderStatus(id, s);
    } else {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: s } : o)));
    }
    toast.success("Buyurtma statusi yangilandi");
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchQ =
      !query.trim() ||
      o.id.toLowerCase().includes(query.toLowerCase()) ||
      o.customer?.name.toLowerCase().includes(query.toLowerCase()) ||
      o.customer?.phone.includes(query);
    return matchStatus && matchQ;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Buyurtmalar Nazorati</h1>
          <p className="text-sm text-muted-foreground">Jonli kelib tushayotgan va bajarilgan buyurtmalar.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex h-11 flex-1 items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 shadow-xs">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buyurtma ID, mijoz ismi yoki tel raqami..."
            className="flex-1 bg-transparent text-xs outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Barchasi" },
            { id: "new", label: "Yangi" },
            { id: "preparing", label: "Tayyorlanmoqda" },
            { id: "delivering", label: "Yo'lda" },
            { id: "delivered", label: "Yetkazildi" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="unstyled"
              size="unset"
              onClick={() => setFilterStatus(tab.id)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-semibold shrink-0 transition-colors",
                filterStatus === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-card border border-border">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <p className="mt-3 font-display font-bold text-base">Buyurtmalar topilmadi</p>
          <p className="mt-1 text-xs text-muted-foreground">Tanlangan filtr bo'yicha buyurtmalar mavjud emas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-extrabold text-sm text-foreground">{order.id}</span>
                  <span className="text-xs text-muted-foreground">· {new Date(order.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-base text-primary">{formatSom(order.total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">Mijoz:</p>
                  <p className="text-sm font-extrabold">{order.customer?.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> {order.customer?.phone}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {order.customer?.address}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">Buyurtma tarkibi:</p>
                  <div className="space-y-1">
                    {order.lines.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{item.qty}x {item.name}</span>
                        <span className="font-semibold text-muted-foreground">{formatSom(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-end gap-2">
                <span className="text-xs font-bold text-muted-foreground mr-auto">Status:</span>
                <Button
                  variant="unstyled"
                  size="unset"
                  onClick={() => handleStatus(order.id, "preparing")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                    order.status === "preparing" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  Tayyorlanmoqda
                </Button>
                <Button
                  variant="unstyled"
                  size="unset"
                  onClick={() => handleStatus(order.id, "delivering")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                    order.status === "delivering" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  Yo'lda
                </Button>
                <Button
                  variant="unstyled"
                  size="unset"
                  onClick={() => handleStatus(order.id, "delivered")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                    order.status === "delivered" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  Yetkazildi
                </Button>
                <Button
                  variant="unstyled"
                  size="unset"
                  onClick={() => handleStatus(order.id, "cancelled")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                    order.status === "cancelled" ? "bg-red-500 text-white" : "bg-muted text-red-500/80 hover:bg-red-500/10",
                  )}
                >
                  Bekor qilish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

