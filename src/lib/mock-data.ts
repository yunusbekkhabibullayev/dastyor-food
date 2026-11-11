import bannerBurger from "@/assets/banner-burger.jpg";
import lavash from "@/assets/lavash.jpg";
import pizza from "@/assets/pizza.jpg";
import splash from "@/assets/splash.jpg";
import chicken from "@/assets/chicken.jpg";
import fries from "@/assets/fries.jpg";
import drink from "@/assets/drink.jpg";
import sauce from "@/assets/sauce.jpg";
import evosLogo from "@/assets/restaurants/evos.png";
import maxwayLogo from "@/assets/restaurants/maxway.png";
import oqtepaLogo from "@/assets/restaurants/oqtepa.jpg";
import bellissimoLogo from "@/assets/restaurants/bellissimo.png";
import lesailesLogo from "@/assets/restaurants/lesailes.jpg";
import choparLogo from "@/assets/restaurants/chopar.jpg";

export const districts = ["Tuman markazi", "Yangiobod", "Bog'ishamol", "Navbahor", "Do'stlik"];

export const menuCategories = [
  "Burgerlar",
  "Lavash",
  "Pizza",
  "Tovuq",
  "Kartoshka",
  "Ichimliklar",
  "Souslar",
] as const;
export type MenuCategory = (typeof menuCategories)[number];
export const categories = ["Barchasi", ...menuCategories];

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: MenuCategory;
  restaurantId: string;
  restaurant: string;
};

export type Restaurant = {
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
  category: MenuCategory;
  tags: MenuCategory[];
};

// Fast local bundled assets — 0ms network latency and 100% reliable in PWA offline mode
const BURGER_PHOTO = splash;
const ORANGE_JUICE = drink;
const LEMONADE = drink;
const MILKSHAKE = drink;

function getProductImage(category: MenuCategory, name: string, i: number): string {
  const n = name.toLowerCase();
  if (n.includes("apelsin") || n.includes("sharbat") || n.includes("sok")) return ORANGE_JUICE;
  if (n.includes("limonad") || n.includes("choy")) return LEMONADE;
  if (n.includes("kokteyl") || n.includes("ayron")) return MILKSHAKE;
  if (category === "Burgerlar") return i % 2 === 0 ? bannerBurger : BURGER_PHOTO;
  if (category === "Lavash") return lavash;
  if (category === "Pizza") return pizza;
  if (category === "Tovuq") return chicken;
  if (category === "Kartoshka") return fries;
  if (category === "Souslar") return sauce;
  return drink;
}

const img: Record<MenuCategory, string[]> = {
  Burgerlar: [bannerBurger, BURGER_PHOTO],
  Lavash: [lavash],
  Pizza: [pizza],
  Tovuq: [chicken],
  Kartoshka: [fries],
  Ichimliklar: [drink, ORANGE_JUICE, LEMONADE],
  Souslar: [sauce],
};

type Item = [MenuCategory, string, number, string];

const menus: Record<string, Item[]> = {
  evos: [
    ["Lavash", "Tovuqli lavash", 32000, "Tovuq go'shti, yangi sabzavotlar va maxsus sous"],
    ["Lavash", "Pishloqli lavash", 35000, "Mol go'shti, cheddar pishlog'i va pomidor"],
    ["Burgerlar", "Gamburger", 26000, "Mol go'shtli kotlet, tuzlangan bodring, ketchup"],
    ["Kartoshka", "Kartoshka fri", 14000, "Oltin rangli qarsildoq kartoshka"],
    ["Ichimliklar", "Kola 0.5 l", 9000, "Muzdek gazlangan ichimlik"],
    ["Souslar", "Sarimsoqli sous", 4000, "Uy usulidagi oq sous"],
  ],
  maxway: [
    ["Burgerlar", "Ikki qavatli pishloqli burger", 42000, "Ikki qavat kotlet, ikki pishloq, bekon"],
    ["Burgerlar", "Klassik burger", 28000, "Mol go'shti, salat bargi, piyoz"],
    ["Lavash", "Max lavash", 34000, "Katta lavash, tovuq va kartoshka fri bilan"],
    ["Kartoshka", "Kartoshka fri katta", 18000, "Katta porsiya"],
    ["Ichimliklar", "Limonad", 12000, "Uy limonadi, yalpiz bilan"],
  ],
  oqtepa: [
    ["Lavash", "Mol go'shtli lavash", 36000, "Mol go'shti va achchiq sous"],
    ["Lavash", "Mini lavash", 24000, "Bolalar uchun kichik porsiya"],
    ["Tovuq", "Tovuq qanotlari", 38000, "6 dona achchiq qanot"],
    ["Ichimliklar", "Ayron", 7000, "Sovuq ayron"],
    ["Souslar", "Achchiq sous", 4000, "Qalampirli qizil sous"],
  ],
  bellissimo: [
    ["Pizza", "Pepperoni pitsa", 79000, "Pepperoni kolbasa, motsarella, pomidor sousi"],
    ["Pizza", "Margarita", 62000, "Motsarella va rayhon"],
    ["Pizza", "To'rt pishloq", 85000, "Motsarella, cheddar, parmezan, dor-blyu"],
    ["Ichimliklar", "Apelsin sharbati", 14000, "Yangi siqilgan"],
    ["Souslar", "Pishloqli sous", 5000, "Issiq cheddar sousi"],
  ],
  lesailes: [
    ["Tovuq", "Tovuq bo'laklari", 45000, "8 dona qarsildoq tovuq"],
    ["Tovuq", "Tovuq filesi", 32000, "5 dona tovuq file"],
    ["Burgerlar", "Tovuqli burger", 30000, "Qarsildoq tovuq file, salat, mayonez"],
    ["Kartoshka", "Qishloqcha kartoshka", 16000, "Ziravorli kartoshka bo'laklari"],
    ["Souslar", "Barbekyu sous", 5000, "Dudlangan ta'm"],
  ],
  chopar: [
    ["Pizza", "Chopar maxsus", 89000, "Mol go'shti, qo'ziqorin, qalampir"],
    ["Pizza", "Tovuqli pitsa", 72000, "Tovuq, ananas, motsarella"],
    ["Kartoshka", "Pishloqli fri", 20000, "Pishloq sousi bilan"],
    ["Ichimliklar", "Kola 1 l", 15000, "Oilaviy hajm"],
  ],
  burgerhouse: [
    ["Burgerlar", "Barbekyu burger", 39000, "Barbekyu sous, piyoz halqalari"],
    ["Burgerlar", "Black Angus", 55000, "Premium mol go'shti, trufel sousi"],
    ["Burgerlar", "Pishloqli burger", 32000, "Cheddar pishlog'i, tuzlangan bodring"],
    ["Kartoshka", "Kartoshka fri", 15000, "Klassik porsiya"],
    ["Ichimliklar", "Sutli kokteyl", 22000, "Vanilli kokteyl"],
  ],
  tovuqcity: [
    ["Tovuq", "Oilaviy chelak", 120000, "16 dona tovuq, 2 fri, 4 sous"],
    ["Tovuq", "Achchiq qanotlar", 36000, "8 dona"],
    ["Lavash", "Tovuq doner", 29000, "Tandir noni, tovuq, salat"],
    ["Kartoshka", "Fri o'rta", 13000, "O'rta porsiya"],
    ["Ichimliklar", "Muzli choy", 10000, "Limonli"],
    ["Souslar", "Ketchup", 3000, "Pomidorli"],
  ],
};

export const restaurants: Restaurant[] = [
  {
    id: "evos",
    name: "Evos",
    short: "EVOS",
    tone: "bg-primary text-primary-foreground",
    cover: lavash,
    logo: evosLogo,
    rating: 4.8,
    reviews: "2.1k",
    time: "25-35",
    delivery: 0,
    minOrder: 30000,
    address: "Mustaqillik ko'chasi, 12",
    category: "Lavash",
    tags: [],
  },
  {
    id: "maxway",
    name: "Max Way",
    short: "MAX",
    tone: "bg-ink text-ink-foreground",
    cover: bannerBurger,
    logo: maxwayLogo,
    rating: 4.7,
    reviews: "1.4k",
    time: "30-40",
    delivery: 0,
    minOrder: 35000,
    address: "Navoiy ko'chasi, 4",
    category: "Burgerlar",
    tags: [],
  },
  {
    id: "oqtepa",
    name: "Oqtepa Lavash",
    short: "OQ",
    tone: "bg-primary-soft text-accent-foreground",
    cover: lavash,
    logo: oqtepaLogo,
    rating: 4.6,
    reviews: "980",
    time: "30-45",
    delivery: 5000,
    minOrder: 25000,
    address: "Bozor yonida, 7",
    category: "Lavash",
    tags: [],
  },
  {
    id: "bellissimo",
    name: "Bellissimo",
    short: "BP",
    tone: "bg-destructive text-destructive-foreground",
    cover: pizza,
    logo: bellissimoLogo,
    rating: 4.5,
    reviews: "760",
    time: "35-50",
    delivery: 0,
    minOrder: 50000,
    address: "Amir Temur ko'chasi, 21",
    category: "Pizza",
    tags: [],
  },
  {
    id: "lesailes",
    name: "Les Ailes",
    short: "LA",
    tone: "bg-star text-ink",
    cover: chicken,
    logo: lesailesLogo,
    rating: 4.4,
    reviews: "620",
    time: "30-45",
    delivery: 7000,
    minOrder: 30000,
    address: "Yoshlik ko'chasi, 3",
    category: "Tovuq",
    tags: [],
  },
  {
    id: "chopar",
    name: "Chopar Pizza",
    short: "CH",
    tone: "bg-secondary text-foreground",
    cover: pizza,
    logo: choparLogo,
    rating: 4.3,
    reviews: "540",
    time: "40-55",
    delivery: 0,
    minOrder: 60000,
    address: "Bog'ishamol, 15",
    category: "Pizza",
    tags: [],
  },
  {
    id: "burgerhouse",
    name: "Burger House",
    short: "BH",
    tone: "bg-ink text-primary",
    cover: splash,
    rating: 4.6,
    reviews: "410",
    time: "25-40",
    delivery: 6000,
    minOrder: 30000,
    address: "Navbahor, 9",
    category: "Burgerlar",
    tags: [],
  },
  {
    id: "tovuqcity",
    name: "Tovuq City",
    short: "TC",
    tone: "bg-primary text-ink",
    cover: chicken,
    rating: 4.2,
    reviews: "330",
    time: "35-50",
    delivery: 0,
    minOrder: 40000,
    address: "Do'stlik, 2",
    category: "Tovuq",
    tags: [],
  },
];

export const products: Product[] = restaurants.flatMap((r) =>
  (menus[r.id] ?? []).map(([category, name, price, description], i) => ({
    id: `${r.id}-${i}`,
    name,
    description,
    price,
    category,
    image: getProductImage(category, name, i),
    restaurantId: r.id,
    restaurant: r.name,
  })),
);

for (const r of restaurants) {
  r.tags = menuCategories.filter((c) => (menus[r.id] ?? []).some((m) => m[0] === c));
}

// Memoized lookups — same array reference on repeated calls, prevents useMemo invalidation
const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));
const menuMap = new Map<string, Product[]>();
for (const r of restaurants) {
  menuMap.set(
    r.id,
    products.filter((p) => p.restaurantId === r.id),
  );
}

export const getRestaurant = (id: string) => restaurantMap.get(id);
export const getMenu = (id: string) => menuMap.get(id) ?? [];

export const matches = (text: string, q: string) =>
  text.toLowerCase().includes(q.trim().toLowerCase());

export const formatSom = (n: number) =>
  `${n.toLocaleString("ru-RU").replace(/[\s,\u00a0\u202f]/g, " ")} UZS`;
export const formatDelivery = (n: number) => (n === 0 ? "Bepul" : formatSom(n));
