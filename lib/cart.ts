type CartItem = {
  id: string;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  mode: "buy" | "rent";
  currency?: string;
};

const STORAGE_KEY = "empi_cart";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getCart(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch (e) {
    console.error("Failed to read cart from localStorage", e);
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save cart to localStorage", e);
  }
}

export function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }) {
  const cart = getCart();
  const qty = item.quantity ?? 1;
  const existingIndex = cart.findIndex((c) => c.id === item.id && c.mode === item.mode);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += qty;
  } else {
    cart.push({ ...item, quantity: qty });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(id: string, mode?: "buy" | "rent") {
  const cart = getCart();
  const filtered = cart.filter((c) => !(c.id === id && (mode ? c.mode === mode : true)));
  saveCart(filtered);
  return filtered;
}

export function clearCart() {
  if (!isBrowser()) return [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function cartTotal() {
  const cart = getCart();
  return cart.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
}

export type { CartItem };
