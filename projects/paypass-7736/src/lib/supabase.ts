import { createClient } from "@supabase/supabase-js";
import { Item, Order } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-b2st.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * High-performance Fallback / In-Memory Mock Store
 * Automatically active if Supabase credentials are empty or during zero-dependency runtime.
 */
class InMemoryDatabase {
  private items = new Map<string, Item>();
  private orders = new Map<string, Order>();

  constructor() {
    // Seed with a sample locked item
    this.items.set("demo-vip", {
      id: "demo-item-1",
      slug: "demo-vip",
      title: "پرامپت سری Midjourney v6 + لینک فایل سورس PSD نئونی",
      description: "با خرید این لینک، پرامپت دقیق فوتورئالیستی به همراه لینک مستقیم دراپ‌باکس با کیفیت 8K آنلاک خواهد شد.",
      contentType: "prompt",
      encryptedContent: "a1b2c3d4e5f678901234567890abcdef:fedcba09876543210987654321fedcba:48656c6c6f20423273742050617950617373", // Will be encrypted properly via action
      price: 49000,
      creatorSheba: "IR120000000000000000000001",
      platformFeePercent: 5,
      creatorNetShare: 46550,
      viewsCount: 342,
      purchasesCount: 48,
      createdAt: new Date().toISOString()
    });
  }

  async saveItem(item: Item): Promise<Item> {
    this.items.set(item.slug, item);
    return item;
  }

  async getItemBySlug(slug: string): Promise<Item | null> {
    return this.items.get(slug) || null;
  }

  async incrementViews(slug: string): Promise<void> {
    const it = this.items.get(slug);
    if (it) {
      it.viewsCount += 1;
      this.items.set(slug, it);
    }
  }

  async saveOrder(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) || null;
  }

  async markOrderPaid(orderId: string, refId: string): Promise<Order | null> {
    const o = this.orders.get(orderId);
    if (!o) return null;
    o.status = "paid";
    o.paymentRefId = refId;
    o.paidAt = new Date().toISOString();
    this.orders.set(orderId, o);

    const it = this.items.get(o.itemId);
    if (it) {
      it.purchasesCount += 1;
    }
    return o;
  }
}

// Global singleton instance for local dev persistence
const globalForDb = global as unknown as { inMemoryDb?: InMemoryDatabase };
export const inMemoryDb = globalForDb.inMemoryDb || new InMemoryDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.inMemoryDb = inMemoryDb;