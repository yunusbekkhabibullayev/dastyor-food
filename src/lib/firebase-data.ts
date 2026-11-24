import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
  Timestamp,
} from "firebase/firestore";
import {
  db,
  isFirebaseConfigured,
  type RestaurantDoc,
  type ProductDoc,
  type CategoryDoc,
  type BannerDoc,
  type OrderDoc,
  type UserDoc,
} from "./firebase";
import {
  restaurants as mockRestaurants,
  products as mockProducts,
  menuCategories,
} from "./mock-data";

export interface SeedResult {
  success: boolean;
  restaurantsCount: number;
  productsCount: number;
  categoriesCount: number;
  bannersCount: number;
  message: string;
}

/**
 * Mavjud mock ma'lumotlarni Firestore ma'lumotlar bazasiga dastlabki yuklash (Seed)
 */
export async function seedFirestoreData(): Promise<SeedResult> {
  if (!db || !isFirebaseConfigured) {
    return {
      success: false,
      restaurantsCount: 0,
      productsCount: 0,
      categoriesCount: 0,
      bannersCount: 0,
      message: "Firebase hali to'liq ulanmagan. .env fayliga kalitlarni kiriting.",
    };
  }

  const now = new Date().toISOString();

  // 1. Kategoriyalarni yuklash
  let catCount = 0;
  for (let i = 0; i < menuCategories.length; i++) {
    const name = menuCategories[i];
    if (!name) continue;
    const catId = `cat-${i + 1}`;
    await setDoc(
      doc(db, "categories", catId),
      {
        id: catId,
        name,
        orderIndex: i + 1,
        isActive: true,
      } as CategoryDoc,
      { merge: true },
    );
    catCount++;
  }

  // 2. Restoranlarni yuklash
  let restCount = 0;
  for (let i = 0; i < mockRestaurants.length; i++) {
    const r = mockRestaurants[i];
    if (!r) continue;
    await setDoc(
      doc(db, "restaurants", r.id),
      {
        id: r.id,
        name: r.name,
        short: r.short,
        tone: r.tone,
        cover: r.cover,
        logo: r.logo || "",
        rating: r.rating,
        reviews: r.reviews,
        time: r.time,
        delivery: r.delivery,
        minOrder: r.minOrder,
        address: r.address,
        category: r.category,
        tags: r.tags,
        isActive: true,
        orderIndex: i + 1,
        createdAt: now,
        updatedAt: now,
      } as RestaurantDoc,
      { merge: true },
    );
    restCount++;
  }

  // 3. Mahsulotlarni yuklash
  let prodCount = 0;
  for (const p of mockProducts) {
    await setDoc(
      doc(db, "products", p.id),
      {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        category: p.category,
        restaurantId: p.restaurantId,
        restaurant: p.restaurant,
        isAvailable: true,
        orderCount: 0,
        createdAt: now,
        updatedAt: now,
      } as ProductDoc,
      { merge: true },
    );
    prodCount++;
  }

  // 4. Boshlang'ich bannerlarni yuklash
  const defaultBanners = [
    {
      id: "banner-1",
      badge: "-20% chegirma",
      title: "Eng yaxshi fast-foodlar endi bir joyda!",
      text: "Buyurtma bering va tezkor yetkazib berishni oling",
      img: mockProducts[0]?.image || "",
      orderIndex: 1,
      isActive: true,
    },
    {
      id: "banner-2",
      badge: "Yangi",
      title: "Issiq pitsalar 30 daqiqada",
      text: "Sevimli pitsangizni uyga buyurtma qiling",
      img: mockProducts[3]?.image || "",
      orderIndex: 2,
      isActive: true,
    },
    {
      id: "banner-3",
      badge: "Bepul yetkazish",
      title: "Lavash va donarlar",
      text: "Ko'pchilik xonalardan yetkazib berish — 0 UZS",
      img: mockProducts[1]?.image || "",
      orderIndex: 3,
      isActive: true,
    },
  ];

  let bannerCount = 0;
  for (const b of defaultBanners) {
    await setDoc(doc(db, "banners", b.id), b as BannerDoc, { merge: true });
    bannerCount++;
  }

  return {
    success: true,
    restaurantsCount: restCount,
    productsCount: prodCount,
    categoriesCount: catCount,
    bannersCount: bannerCount,
    message: "Barcha ma'lumotlar Firestore ma'lumotlar bazasiga muvaffaqiyatli yuklandi!",
  };
}

/**
 * ========================================================
 * Admin va Ilova uchun Firestore CRUD amallari
 * ========================================================
 */

// RESTORANLAR
export async function getFirestoreRestaurants(): Promise<RestaurantDoc[]> {
  if (!db || !isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(collection(db, "restaurants"));
    return snap.docs.map((d) => d.data() as RestaurantDoc);
  } catch (err) {
    console.warn("Restoranlarni olishda xatolik:", err);
    return [];
  }
}

export async function upsertFirestoreRestaurant(r: RestaurantDoc): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  const now = new Date().toISOString();
  await setDoc(
    doc(db, "restaurants", r.id),
    {
      ...r,
      updatedAt: now,
      createdAt: r.createdAt || now,
    },
    { merge: true },
  );
}

export async function deleteFirestoreRestaurant(id: string): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  await deleteDoc(doc(db, "restaurants", id));
}

// MAHSULOTLAR
export async function getFirestoreProducts(): Promise<ProductDoc[]> {
  if (!db || !isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(collection(db, "products"));
    return snap.docs.map((d) => d.data() as ProductDoc);
  } catch (err) {
    console.warn("Mahsulotlarni olishda xatolik:", err);
    return [];
  }
}

export async function upsertFirestoreProduct(p: ProductDoc): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  const now = new Date().toISOString();
  await setDoc(
    doc(db, "products", p.id),
    {
      ...p,
      updatedAt: now,
      createdAt: p.createdAt || now,
    },
    { merge: true },
  );
}

export async function deleteFirestoreProduct(id: string): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  await deleteDoc(doc(db, "products", id));
}

// KATEGORIYALAR
export async function getFirestoreCategories(): Promise<CategoryDoc[]> {
  if (!db || !isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(collection(db, "categories"));
    return snap.docs.map((d) => d.data() as CategoryDoc);
  } catch (err) {
    console.warn("Kategoriyalarni olishda xatolik:", err);
    return [];
  }
}

export async function upsertFirestoreCategory(c: CategoryDoc): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  await setDoc(doc(db, "categories", c.id), c, { merge: true });
}

export async function deleteFirestoreCategory(id: string): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  await deleteDoc(doc(db, "categories", id));
}

// BANNERLAR
export async function getFirestoreBanners(): Promise<BannerDoc[]> {
  if (!db || !isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(collection(db, "banners"));
    return snap.docs.map((d) => d.data() as BannerDoc);
  } catch (err) {
    console.warn("Bannerlarni olishda xatolik:", err);
    return [];
  }
}

export async function upsertFirestoreBanner(b: BannerDoc): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  await setDoc(doc(db, "banners", b.id), b, { merge: true });
}

export async function deleteFirestoreBanner(id: string): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  await deleteDoc(doc(db, "banners", id));
}

// BUYURTMALAR (Jonli monitoring)
export async function getFirestoreOrders(): Promise<OrderDoc[]> {
  if (!db || !isFirebaseConfigured) return [];
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as OrderDoc);
  } catch (err) {
    console.warn("Buyurtmalarni olishda xatolik:", err);
    return [];
  }
}

export function subscribeToFirestoreOrders(callback: (orders: OrderDoc[]) => void): () => void {
  if (!db || !isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const orders = snap.docs.map((d) => d.data() as OrderDoc);
        callback(orders);
      },
      (err) => {
        console.warn("Buyurtmalar tinglovchisi xatosi:", err);
      },
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Jonli buyurtmalarga ulanishda xatolik:", err);
    return () => {};
  }
}

export async function updateFirestoreOrderStatus(
  orderId: string,
  status: OrderDoc["status"],
): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}

function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as unknown as T;
  if (Array.isArray(obj)) return obj.map(cleanUndefined) as unknown as T;
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        res[k] = cleanUndefined(v);
      }
    }
    return res as T;
  }
  return obj;
}

export async function createFirestoreOrder(order: OrderDoc): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  const sanitized = cleanUndefined(order);
  await setDoc(doc(db, "orders", order.id), sanitized);
}

export async function deleteFirestoreOrder(orderId: string): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  await deleteDoc(doc(db, "orders", orderId));
}

export async function bulkDeleteFirestoreOrders(orderIds: string[]): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  await Promise.all(orderIds.map((id) => deleteDoc(doc(db, "orders", id))));
}

// ==================== MIJOZLAR (USERS) VA ULARNING BUYURTMALARI ====================

export function normalizePhone(raw?: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (!cleaned.startsWith("+") && cleaned.startsWith("998")) {
    return `+${cleaned}`;
  }
  return cleaned;
}

export async function getFirestoreUser(phone: string): Promise<UserDoc | null> {
  const norm = normalizePhone(phone);
  if (!db || !isFirebaseConfigured || !norm) return null;
  try {
    const snap = await getDoc(doc(db, "users", norm));
    if (snap.exists()) {
      return snap.data() as UserDoc;
    }
    return null;
  } catch (err) {
    console.warn("Foydalanuvchi ma'lumotlarini olishda xatolik:", err);
    return null;
  }
}

export async function saveFirestoreUser(userData: Partial<UserDoc> & { phone: string }): Promise<void> {
  const norm = normalizePhone(userData.phone);
  if (!db || !isFirebaseConfigured || !norm) return;
  try {
    const now = new Date().toISOString();
    const userRef = doc(db, "users", norm);
    const existing = await getDoc(userRef);

    const payload: Partial<UserDoc> = {
      id: norm,
      phone: norm,
      updatedAt: now,
      ...(userData.name ? { name: userData.name } : {}),
      ...(userData.addresses ? { addresses: userData.addresses } : {}),
      ...(userData.defaultAddressId !== undefined ? { defaultAddressId: userData.defaultAddressId } : {}),
      ...(userData.location ? { location: userData.location } : {}),
    };

    if (!existing.exists()) {
      payload.createdAt = now;
      payload.totalOrders = 0;
      payload.totalSpent = 0;
    }

    const sanitized = cleanUndefined(payload);
    await setDoc(userRef, sanitized, { merge: true });
  } catch (err) {
    console.warn("Foydalanuvchini Firestorega saqlashda xatolik:", err);
  }
}

export async function incrementUserOrderStats(phone: string, orderTotal: number): Promise<void> {
  const norm = normalizePhone(phone);
  if (!db || !isFirebaseConfigured || !norm) return;
  try {
    const userRef = doc(db, "users", norm);
    await updateDoc(userRef, {
      totalOrders: increment(1),
      totalSpent: increment(orderTotal),
      updatedAt: new Date().toISOString(),
    });
  } catch {}
}

export function subscribeToUserOrders(phone: string, callback: (orders: OrderDoc[]) => void): () => void {
  const norm = normalizePhone(phone);
  if (!db || !isFirebaseConfigured || !norm) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map((d) => d.data() as OrderDoc);
        const userOrders = all.filter((o) => {
          const p = normalizePhone(o.customer?.phone);
          return p === norm || o.userId === norm;
        });
        callback(userOrders);
      },
      (err) => {
        console.warn("User buyurtmalari tinglovchisi xatosi:", err);
      },
    );
    return unsubscribe;
  } catch (err) {
    console.warn("User buyurtmalariga ulanishda xatolik:", err);
    return () => {};
  }
}

export function subscribeToOrder(orderId: string, callback: (order: OrderDoc | null) => void): () => void {
  if (!db || !isFirebaseConfigured || !orderId) {
    callback(null);
    return () => {};
  }

  try {
    const unsubscribe = onSnapshot(
      doc(db, "orders", orderId),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as OrderDoc);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn("Buyurtma statusi tinglovchisi xatosi:", err);
      },
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Buyurtmaga ulanishda xatolik:", err);
    return () => {};
  }
}


