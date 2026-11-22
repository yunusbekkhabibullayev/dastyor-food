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
} from "./firebase";
import { collection, onSnapshot, getDocs } from "firebase/firestore";

// Shared in-memory cache to prevent flashing across page navigations
let cachedProducts: Product[] = defaultProducts;
let cachedCategories: string[] = defaultCategories;
let cachedRestaurants: Restaurant[] = defaultRestaurants;
let isInitialized = false;

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
            logo: r.logo,
            rating: r.rating,
            reviews: r.reviews,
            time: r.time,
            delivery: r.delivery,
            minOrder: r.minOrder,
            address: r.address,
            category: r.category as any,
            tags: r.tags || [],
          }));
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
          notify();
        }
      },
      (err) => console.warn("Products snapshot warning:", err),
    );

    isInitialized = true;
  } catch (err) {
    console.warn("Failed to attach Firestore listeners:", err);
  }
}

export function useFoodData() {
  const [products, setProducts] = useState<Product[]>(cachedProducts);
  const [categories, setCategories] = useState<string[]>(cachedCategories);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(cachedRestaurants);

  useEffect(() => {
    const handleUpdate = () => {
      setProducts(cachedProducts);
      setCategories(cachedCategories);
      setRestaurants(cachedRestaurants);
    };

    listeners.add(handleUpdate);
    // Sync immediate cache
    handleUpdate();

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    products,
    categories,
    restaurants,
  };
}

