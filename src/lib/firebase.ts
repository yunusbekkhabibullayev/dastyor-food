import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== "your_firebase_api_key_here",
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== "undefined" || isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    if (isFirebaseConfigured) {
      console.warn("Firebase initialization warning:", err);
    }
  }
}

export { app, auth, db, storage };

/**
 * Firestore Ma'lumotlar Modeli Tiplari (Data Types)
 */

export interface RestaurantDoc {
  id: string;
  name: string;
  short: string;
  tone: string;
  cover: string;
  logo?: string;
  rating: number;
  reviews: string;
  time: string;
  delivery: number;
  minOrder: number;
  address: string;
  category: string;
  tags: string[];
  isActive?: boolean;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductDoc {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  restaurantId: string;
  restaurant: string;
  isAvailable?: boolean;
  orderCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryDoc {
  id: string;
  name: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface BannerDoc {
  id: string;
  img: string;
  badge: string;
  title: string;
  text: string;
  linkTo?: string;
  isActive?: boolean;
  orderIndex?: number;
}

export interface OrderDoc {
  id: string;
  createdAt: string;
  restaurantId: string;
  restaurantName?: string;
  lines: {
    productId: string;
    name: string;
    price: number;
    qty: number;
  }[];
  subtotal: number;
  delivery: number;
  total: number;
  status: "new" | "preparing" | "delivering" | "delivered" | "cancelled";
  customer: {
    name: string;
    phone: string;
    address: string;
    lat?: number;
    lng?: number;
    payment?: string;
    notes?: string;
  };
  updatedAt?: string;
}
