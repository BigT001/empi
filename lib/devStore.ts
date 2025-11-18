// Development in-memory store for testing without database
// This is ONLY for development - production uses real Supabase

interface DevProduct {
  id: string;
  name: string;
  description: string;
  sellPrice: number;
  rentPrice: number;
  category: string;
  badge: string | null;
  image: string;
  images: string[];
  sizes: string | null;
  color: string | null;
  material: string | null;
  condition: string | null;
  careInstructions: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DevOrder {
  id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string;
  busStop: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  shippingType: string;
  shippingCost: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: string;
  items: any[];
  createdAt: string;
  updatedAt: string;
}

interface DevCart {
  sessionId: string;
  items: any[];
}

class DevStore {
  private products: Map<string, DevProduct> = new Map();
  private orders: Map<string, DevOrder> = new Map();
  private carts: Map<string, DevCart> = new Map();

  // Products
  addProduct(product: DevProduct): DevProduct {
    this.products.set(product.id, product);
    return product;
  }

  getProduct(id: string): DevProduct | undefined {
    return this.products.get(id);
  }

  getAllProducts(): DevProduct[] {
    return Array.from(this.products.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  updateProduct(id: string, updates: Partial<DevProduct>): DevProduct | null {
    const product = this.products.get(id);
    if (!product) return null;
    const updated = { ...product, ...updates, updatedAt: new Date().toISOString() };
    this.products.set(id, updated);
    return updated;
  }

  deleteProduct(id: string): boolean {
    return this.products.delete(id);
  }

  // Orders
  addOrder(order: DevOrder): DevOrder {
    this.orders.set(order.id, order);
    return order;
  }

  getOrder(id: string): DevOrder | undefined {
    return this.orders.get(id);
  }

  getAllOrders(): DevOrder[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Carts
  setCart(sessionId: string, cart: DevCart): DevCart {
    this.carts.set(sessionId, cart);
    return cart;
  }

  getCart(sessionId: string): DevCart | undefined {
    return this.carts.get(sessionId);
  }

  clearCart(sessionId: string): boolean {
    return this.carts.delete(sessionId);
  }
}

// Singleton instance
export const devStore = new DevStore();
