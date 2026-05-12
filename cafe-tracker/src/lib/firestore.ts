import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  enabled: boolean;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentType = "Cash" | "UPI" | "Split" | "Pending";

export interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  paymentType: PaymentType;
  createdAt: Timestamp | null;
}

const DEFAULT_MENU_ITEMS = [
  { name: "Chai", price: 15, category: "Beverages", enabled: true },
  { name: "Cold Coffee", price: 60, category: "Beverages", enabled: true },
  { name: "Lassi", price: 40, category: "Beverages", enabled: true },
  { name: "Samosa", price: 20, category: "Snacks", enabled: true },
  { name: "Pakoda", price: 25, category: "Snacks", enabled: true },
  { name: "Veg Sandwich", price: 50, category: "Food", enabled: true },
];

async function seedDefaultMenuItems() {
  const menuCol = collection(db, "menuItems");
  const snapshot = await getDocs(menuCol);
  if (snapshot.empty) {
    for (const item of DEFAULT_MENU_ITEMS) {
      await addDoc(menuCol, item);
    }
  }
}

seedDefaultMenuItems().catch(console.error);

export function subscribeToMenuItems(callback: (items: MenuItem[]) => void) {
  const q = query(collection(db, "menuItems"), orderBy("name"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem));
    callback(items);
  });
}

export async function addMenuItem(item: Omit<MenuItem, "id">) {
  return addDoc(collection(db, "menuItems"), item);
}

export async function updateMenuItem(id: string, data: Partial<Omit<MenuItem, "id">>) {
  // Firestore silently ignores `undefined` values — strip them so the write actually lands
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<Omit<MenuItem, "id">>;
  return updateDoc(doc(db, "menuItems", id), clean);
}

export async function deleteMenuItem(id: string) {
  return deleteDoc(doc(db, "menuItems", id));
}

export function subscribeSales(callback: (sales: Sale[]) => void) {
  const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const sales = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sale));
    callback(sales);
  });
}

export async function addSale(sale: Omit<Sale, "id" | "createdAt">) {
  return addDoc(collection(db, "sales"), { ...sale, createdAt: serverTimestamp() });
}

export async function deleteSale(id: string) {
  return deleteDoc(doc(db, "sales", id));
}

export async function updateSale(id: string, data: Partial<Omit<Sale, "id">>) {
  return updateDoc(doc(db, "sales", id), data);
}
