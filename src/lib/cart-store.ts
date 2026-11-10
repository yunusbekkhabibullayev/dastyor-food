import { useSyncExternalStore } from "react";
import { getRestaurant, products, type Product } from "./mock-data";

export type Order = {
  id: string;
  createdAt: string;
  restaurantId: string;
  lines: { productId: string; name: string; price: number; qty: number }[];
  subtotal: number;
  delivery: number;
  total: number;
  customer: {
    name: string;
    phone: string;
    address: string;
    lat?: number | undefined;
    lng?: number | undefined;
    payment?: string | undefined;
    notes?: string | undefined;
  };
};

export type Profile = { name: string; phone: string };
type State = {
  items: Record<string, number>;
  liked: string[];
  likedRestaurants: string[];
  orders: Order[];
  lastOrder: Order | null;
  profile: Profile;
  ready?: boolean;
};
const EMPTY: State = {
  items: {},
  liked: [],
  likedRestaurants: [],
  orders: [],
  lastOrder: null,
  profile: { name: "Mehmon", phone: "+998 " },
};
const KEY = "fastfood-cart-v1";
let state: State = { ...EMPTY };
const SERVER_STATE: State = { ...EMPTY, ready: false };
const subs = new Set<() => void>();
const set = (s: State) => {
  state = s;
  try {
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
};

const byId = (id: string) => products.find((p) => p.id === id);

/** Restaurant that the current cart belongs to (one restaurant per order). */
export const cartRestaurantId = (s: State) => {
  const first = Object.keys(s.items)[0];
  return first ? (byId(first)?.restaurantId ?? null) : null;
};

export type AddResult = "ok" | "conflict";

export const cart = {
  /** Call once on the client after hydration to restore the saved cart. */
  hydrate: () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        state = { ...state, ready: true };
        subs.forEach((f) => f());
        return;
      }
      const saved = JSON.parse(raw) as Partial<State>;
      const validItems = Object.entries(saved.items ?? {}).filter(
        ([id, q]) => byId(id) && typeof q === "number" && Number.isSafeInteger(q) && q > 0,
      );
      const firstRestaurant = validItems[0] ? byId(validItems[0][0])?.restaurantId : undefined;
      const items = Object.fromEntries(
        validItems.filter(([id]) => byId(id)?.restaurantId === firstRestaurant),
      );
      const orders = Array.isArray(saved.orders)
        ? saved.orders
        : saved.lastOrder
          ? [saved.lastOrder]
          : [];
      state = {
        items,
        liked: Array.isArray(saved.liked)
          ? saved.liked.filter((id) => typeof id === "string" && byId(id))
          : [],
        likedRestaurants: Array.isArray(saved.likedRestaurants)
          ? saved.likedRestaurants.filter((id) => typeof id === "string" && getRestaurant(id))
          : [],
        orders,
        lastOrder: saved.lastOrder ?? orders[0] ?? null,
        profile:
          saved.profile &&
          typeof saved.profile.name === "string" &&
          typeof saved.profile.phone === "string"
            ? saved.profile
            : EMPTY.profile,
        ready: true,
      };
      subs.forEach((f) => f());
    } catch {
      state = { ...EMPTY, ready: true };
      subs.forEach((f) => f());
    }
  },
  add: (id: string, qty = 1, replace = false): AddResult => {
    const p = byId(id);
    if (!p || !Number.isSafeInteger(qty) || qty < 1) return "ok";
    const current = cartRestaurantId(state);
    if (current && current !== p.restaurantId) {
      if (!replace) return "conflict";
      set({ ...state, items: { [id]: qty } });
      return "ok";
    }
    set({ ...state, items: { ...state.items, [id]: (state.items[id] ?? 0) + qty } });
    return "ok";
  },
  dec: (id: string) => {
    const items = { ...state.items };
    if ((items[id] ?? 0) <= 1) delete items[id];
    else items[id] = (items[id] ?? 1) - 1;
    set({ ...state, items });
  },
  remove: (id: string) => {
    const items = { ...state.items };
    delete items[id];
    set({ ...state, items });
  },
  clear: () => set({ ...state, items: {} }),
  toggleLike: (id: string) =>
    set({
      ...state,
      liked: state.liked.includes(id) ? state.liked.filter((x) => x !== id) : [...state.liked, id],
    }),
  toggleLikeRestaurant: (id: string) =>
    set({
      ...state,
      likedRestaurants: state.likedRestaurants.includes(id)
        ? state.likedRestaurants.filter((x) => x !== id)
        : [...state.likedRestaurants, id],
    }),
  setProfile: (profile: Profile) => set({ ...state, profile }),
  createOrder: (customer: Order["customer"]): Order | null => {
    const t = cartTotals(state);
    if (!t.restaurantId || t.lines.length === 0) return null;
    const order: Order = {
      id: `FF-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`,
      createdAt: new Date().toISOString(),
      restaurantId: t.restaurantId,
      lines: t.lines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        price: l.product.price,
        qty: l.qty,
      })),
      subtotal: t.subtotal,
      delivery: t.delivery,
      total: t.total,
      customer,
    };
    return order;
  },
  commitOrder: (order: Order) => {
    if (state.orders.some((saved) => saved.id === order.id)) return;
    set({ ...state, items: {}, lastOrder: order, orders: [order, ...state.orders].slice(0, 30) });
  },
  placeOrder: (customer: Order["customer"]): Order | null => {
    const order = cart.createOrder(customer);
    if (order) cart.commitOrder(order);
    return order;
  },
  reset: () => set({ ...EMPTY, ready: true }),
  get: () => state,
};

export type CartLine = { product: Product; qty: number; lineTotal: number };

export function cartTotals(s: State) {
  const lines: CartLine[] = Object.entries(s.items).flatMap(([id, qty]) => {
    const product = byId(id);
    return product ? [{ product, qty, lineTotal: product.price * qty }] : [];
  });
  const restaurantId = cartRestaurantId(s);
  const subtotal = lines.reduce((t, l) => t + l.lineTotal, 0);
  const delivery = restaurantId && lines.length ? (getRestaurant(restaurantId)?.delivery ?? 0) : 0;
  return {
    lines,
    restaurantId,
    subtotal,
    delivery,
    total: subtotal + delivery,
    count: lines.reduce((a, l) => a + l.qty, 0),
  };
}

export const cartCount = (s: State) => Object.values(s.items).reduce((a, b) => a + b, 0);
export const cartTotal = (s: State) => cartTotals(s).subtotal;

export function useCart() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
    () => SERVER_STATE,
  );
}

/** Targeted selector: only triggers re-renders when this specific product quantity changes */
export function useCartItemQty(id: string) {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state.items[id] ?? 0,
    () => 0,
  );
}

/** Targeted selector: only triggers re-renders when this specific product like status changes */
export function useIsProductLiked(id: string) {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state.liked.includes(id),
    () => false,
  );
}

/** Targeted selector: only triggers re-renders when this specific restaurant like status changes */
export function useIsRestaurantLiked(id: string) {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state.likedRestaurants.includes(id),
    () => false,
  );
}

/** Demo status timeline: each stage lasts STAGE_MS after the order is placed. */
export const orderStages = [
  "Buyurtma qabul qilindi",
  "Tayyorlanmoqda",
  "Yo'lda",
  "Yetkazildi",
] as const;
export const STAGE_MS = 30_000;
export function orderStageIndex(order: Pick<Order, "createdAt">, now: number) {
  const elapsed = Math.max(0, now - new Date(order.createdAt).getTime());
  return Math.min(orderStages.length - 1, Math.floor(elapsed / STAGE_MS));
}
export function orderEtaMinutes(order: Pick<Order, "createdAt">, now: number) {
  const left = new Date(order.createdAt).getTime() + STAGE_MS * (orderStages.length - 1) - now;
  return Math.max(0, Math.ceil(left / 60_000));
}
