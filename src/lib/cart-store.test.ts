import { describe, it, expect, beforeEach } from "vitest";
import { cart, cartCount, cartTotals, orderStageIndex, STAGE_MS } from "./cart-store";
import { getMenu, products, restaurants, menuCategories } from "./mock-data";

const evos = getMenu("evos"); // delivery 0
const oqtepa = getMenu("oqtepa"); // delivery 5000

describe("cart", () => {
  beforeEach(() => cart.reset());

  it("calculates line subtotals and total", () => {
    cart.add(evos[0]!.id, 2); // 32 000 x2
    cart.add(evos[3]!.id); // 14 000
    const t = cartTotals(cart.get());
    expect(t.lines.find((l) => l.product.id === evos[0]!.id)?.lineTotal).toBe(64000);
    expect(t.subtotal).toBe(78000);
    expect(t.total).toBe(78000);
  });

  it("adds the restaurant delivery fee to the final amount", () => {
    cart.add(oqtepa[0]!.id); // 36 000
    const t = cartTotals(cart.get());
    expect(t.delivery).toBe(5000);
    expect(t.total).toBe(41000);
  });

  it("increase, decrease and remove update quantities", () => {
    cart.add(evos[0]!.id);
    cart.add(evos[0]!.id);
    expect(cartCount(cart.get())).toBe(2);
    cart.dec(evos[0]!.id);
    expect(cartCount(cart.get())).toBe(1);
    cart.add(evos[1]!.id, 3);
    cart.remove(evos[1]!.id);
    expect(cartCount(cart.get())).toBe(1);
    cart.dec(evos[0]!.id);
    expect(cartCount(cart.get())).toBe(0);
  });

  it("allows products from only one restaurant per order", () => {
    cart.add(evos[0]!.id);
    expect(cart.add(oqtepa[0]!.id)).toBe("conflict");
    expect(cartTotals(cart.get()).restaurantId).toBe("evos");
    cart.add(oqtepa[0]!.id, 1, true);
    const t = cartTotals(cart.get());
    expect(t.restaurantId).toBe("oqtepa");
    expect(t.count).toBe(1);
  });

  it("placing a demo order empties the cart and keeps the order", () => {
    cart.add(oqtepa[0]!.id, 2);
    const o = cart.placeOrder({
      name: "Ali",
      phone: "+998901234567",
      address: "x",
      payment: "Naqd pul",
    });
    expect(o?.total).toBe(77000);
    expect(cartCount(cart.get())).toBe(0);
    expect(cart.get().lastOrder?.id).toBe(o?.id);
  });
});

describe("mock data", () => {
  it("has at least 8 restaurants and 24 products", () => {
    expect(restaurants.length).toBeGreaterThanOrEqual(8);
    expect(products.length).toBeGreaterThanOrEqual(24);
  });
  it("covers every required category", () => {
    for (const c of menuCategories) expect(products.some((p) => p.category === c)).toBe(true);
  });
});

describe("orders, favorites and profile", () => {
  beforeEach(() => cart.reset());
  it("keeps previous orders newest first", () => {
    cart.add(evos[0]!.id);
    const a = cart.placeOrder({ name: "A", phone: "1", address: "x", payment: "Karta" });
    cart.add(evos[1]!.id);
    const b = cart.placeOrder({ name: "A", phone: "1", address: "x", payment: "Karta" });
    expect(cart.get().orders.map((o) => o.id)).toEqual([b!.id, a!.id]);
  });
  it("demo status moves through the 4 stages over time", () => {
    const createdAt = new Date(0).toISOString();
    expect(orderStageIndex({ createdAt }, 0)).toBe(0);
    expect(orderStageIndex({ createdAt }, STAGE_MS)).toBe(1);
    expect(orderStageIndex({ createdAt }, STAGE_MS * 2)).toBe(2);
    expect(orderStageIndex({ createdAt }, STAGE_MS * 99)).toBe(3);
  });
  it("toggles favorite restaurants and products", () => {
    cart.toggleLikeRestaurant("evos");
    cart.toggleLike(evos[0]!.id);
    expect(cart.get().likedRestaurants).toEqual(["evos"]);
    expect(cart.get().liked).toEqual([evos[0]!.id]);
    cart.toggleLikeRestaurant("evos");
    expect(cart.get().likedRestaurants).toEqual([]);
  });
  it("saves the edited profile", () => {
    cart.setProfile({ name: "Bunyod", phone: "+998901234567" });
    expect(cart.get().profile.name).toBe("Bunyod");
  });
  it("restores cart, favorites, profile and orders from localStorage", () => {
    cart.add("evos-0", 2);
    cart.toggleLike("evos-0");
    cart.toggleLikeRestaurant("evos");
    cart.setProfile({ name: "Bunyod", phone: "+998901234567" });
    cart.placeOrder({
      name: "Bunyod",
      phone: "+998901234567",
      address: "Navoiy 12",
      payment: "Karta",
    });
    cart.add("oqtepa-0");
    const saved = localStorage.getItem("fastfood-cart-v1");
    if (!saved) throw new Error("Missing persisted demo state");
    cart.reset();
    localStorage.setItem("fastfood-cart-v1", saved);
    cart.hydrate();
    expect(cart.get().items).toEqual({ "oqtepa-0": 1 });
    expect(cart.get().liked).toEqual(["evos-0"]);
    expect(cart.get().likedRestaurants).toEqual(["evos"]);
    expect(cart.get().profile.name).toBe("Bunyod");
    expect(cart.get().orders[0]?.total).toBe(64000);
  });
  it("discards invalid saved quantities and mixed restaurant items", () => {
    localStorage.setItem(
      "fastfood-cart-v1",
      JSON.stringify({ items: { "evos-0": 2, "evos-1": 1.5, "oqtepa-0": 1, missing: 1 } }),
    );
    cart.hydrate();
    expect(cart.get().items).toEqual({ "evos-0": 2 });
  });
  it("recovers from corrupt localStorage", () => {
    localStorage.setItem("fastfood-cart-v1", "not json");
    cart.hydrate();
    expect(cart.get().items).toEqual({});
    expect(cart.get().ready).toBe(true);
  });
});
