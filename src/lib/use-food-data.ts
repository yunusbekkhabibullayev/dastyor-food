import { useState, useEffect } from "react";
import {
  products as defaultProducts,
  categories as defaultCategories,
  restaurants as defaultRestaurants,
  type Product,
  type Restaurant,
} from "./mock-data";
import {
  isFirebaseConfigured,
  db,
  type ProductDoc,
  type CategoryDoc,
  type RestaurantDoc,
  type BannerDoc,
} from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";

export interface AppBanner {
  id: string;
  badge: string;
  title: string;
  text: string;
  img: string;
  link?: string;
}

const resolveLogo = (logo?: string, id?: string) => {
  if (!logo) return defaultRestaurants.find((d) => d.id === id)?.logo;
  if (logo.startsWith("src/") || logo.startsWith("/src/") || logo.startsWith("/@fs/")) {
    return defaultRestaurants.find((d) => d.id === id)?.logo;
  }
  return logo;
};

const CACHE_KEY_PRODUCTS = "dastyor_cache_products_v3";
const CACHE_KEY_CATEGORIES = "dastyor_cache_categories_v3";
const CACHE_KEY_RESTAURANTS = "dastyor_cache_restaurants_v3";
const CACHE_KEY_BANNERS = "dastyor_cache_banners_v3";

function readLocalCache<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as T;
    }
  } catch {}
  return fallback;
}

// When Firebase is configured, initialize strictly with real cached data (or empty), NEVER with old mock data!
let cachedProducts: Product[] = isFirebaseConfigured
  ? readLocalCache<Product[]>(CACHE_KEY_PRODUCTS, [])
  : defaultProducts;
let cachedCategories: string[] = isFirebaseConfigured
  ? readLocalCache<string[]>(CACHE_KEY_CATEGORIES, ["Barchasi"])
  : defaultCategories;
let cachedRestaurants: Restaurant[] = isFirebaseConfigured
  ? readLocalCache<Restaurant[]>(CACHE_KEY_RESTAURANTS, [])
  : defaultRestaurants;
let cachedBanners: AppBanner[] = isFirebaseConfigured
  ? readLocalCache<AppBanner[]>(CACHE_KEY_BANNERS, [])
  : [];
let isLoaded = cachedProducts.length > 0;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined" && isFirebaseConfigured && db) {
  try {
    // 1. Categories real-time listener
    onSnapshot(
      collection(db, "categories"),
      (snap) => {
        if (!snap.empty) {
          const liveCats = snap.docs.map((d) => d.data() as CategoryDoc);
          const sorted = liveCats
            .filter((c) => c.isActive !== false)
            .sort((a, b) => (Number(a.orderIndex) || 0) - (Number(b.orderIndex) || 0));
          cachedCategories = ["Barchasi", ...sorted.map((c) => c.name)];
          try {
            localStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(cachedCategories));
          } catch {}
          notify();
        }
      },
      (err) => console.warn("Categories snapshot warning:", err),
    );

    // 2. Restaurants real-time listener
    onSnapshot(
      collection(db, "restaurants"),
      (snap) => {
        if (!snap.empty) {
          const liveRests = snap.docs.map((d) => d.data() as RestaurantDoc);
          const activeRests = liveRests.filter((r) => r.isActive !== false);
          cachedRestaurants = activeRests.map((r) => ({
            id: r.id,
            name: r.name,
            short: r.short,
            tone: r.tone,
            cover: r.cover,
            logo: resolveLogo(r.logo, r.id),
            rating: r.rating,
            reviews: r.reviews,
            time: r.time,
            delivery: r.delivery,
            minOrder: r.minOrder,
            address: r.address,
            category: r.category as any,
            tags: r.tags || [],
          }));
          try {
            localStorage.setItem(CACHE_KEY_RESTAURANTS, JSON.stringify(cachedRestaurants));
          } catch {}
          notify();
        }
      },
      (err) => console.warn("Restaurants snapshot warning:", err),
    );

    // 3. Products real-time listener
    onSnapshot(
      collection(db, "products"),
      (snap) => {
        if (!snap.empty) {
          const liveProds = snap.docs.map((d) => d.data() as ProductDoc);
          const activeProds = liveProds.filter((p) => p.isAvailable !== false);
          cachedProducts = activeProds.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.image,
            category: p.category as any,
            restaurantId: p.restaurantId,
            restaurant: p.restaurant,
          }));
          isLoaded = true;
          try {
            localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(cachedProducts));
          } catch {}
          notify();
        }
      },
      (err) => console.warn("Products snapshot warning:", err),
    );

    // 4. Banners real-time listener
    onSnapshot(
      collection(db, "banners"),
      (snap) => {
        if (!snap.empty) {
          const liveBanners = snap.docs.map((d) => d.data() as BannerDoc);
          cachedBanners = liveBanners
            .filter((b) => b.isActive !== false)
            .map((b) => ({
              id: b.id,
              badge: b.badge,
              title: b.title,
              text: b.text,
              img: b.img,
              link: b.link,
            }));
          try {
            localStorage.setItem(CACHE_KEY_BANNERS, JSON.stringify(cachedBanners));
          } catch {}
          notify();
        }
      },
      (err) => console.warn("Banners snapshot warning:", err),
    );
  } catch (err) {
    console.warn("Failed to attach Firestore listeners:", err);
  }
}

export function getLiveProduct(id: string): Product | undefined {
  return cachedProducts.find((p) => p.id === id);
}

export function getLiveRestaurant(idOrSlug: string): Restaurant | undefined {
  if (!idOrSlug) return undefined;
  const lower = idOrSlug.toLowerCase().trim();
  return cachedRestaurants.find(
    (r) =>
      r.id.toLowerCase() === lower ||
      r.name.toLowerCase() === lower ||
      r.name.toLowerCase().replace(/\s+/g, "") === lower,
  );
}

export function getLiveMenu(restaurantIdOrName: string): Product[] {
  if (!restaurantIdOrName) return [];
  const lower = restaurantIdOrName.toLowerCase().trim();
  const rest = getLiveRestaurant(lower);
  return cachedProducts.filter(
    (p) =>
      p.restaurantId?.toLowerCase() === lower ||
      (rest && p.restaurantId?.toLowerCase() === rest.id.toLowerCase()) ||
      p.restaurant?.toLowerCase() === lower ||
      (rest && p.restaurant?.toLowerCase() === rest.name.toLowerCase()) ||
      p.restaurantId?.toLowerCase() === lower.replace(/\s+/g, ""),
  );
}

export function useFoodData() {
  const [products, setProducts] = useState<Product[]>(cachedProducts);
  const [categories, setCategories] = useState<string[]>(cachedCategories);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(cachedRestaurants);
  const [banners, setBanners] = useState<AppBanner[]>(cachedBanners);
  const [loaded, setLoaded] = useState(isLoaded);

  useEffect(() => {
    const handleUpdate = () => {
      setProducts(cachedProducts);
      setCategories(cachedCategories);
      setRestaurants(cachedRestaurants);
      setBanners(cachedBanners);
      setLoaded(isLoaded);
    };

    listeners.add(handleUpdate);
    handleUpdate();

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    products,
    categories,
    restaurants,
    banners,
    isLoaded: loaded,
    getProduct: getLiveProduct,
    getRestaurant: getLiveRestaurant,
    getMenu: getLiveMenu,
  };
}
