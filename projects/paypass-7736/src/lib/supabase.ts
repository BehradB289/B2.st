/**
 * کلاینت شبیه‌ساز و اتصالی سوپابیس (Supabase) برای پی‌پاس
 */

import { PayPassItem, PayPassOrder } from '../types/paypass';

// مموری‌استور پیش‌فرض جهت تست‌های واحد و ایزوله بودن بدون نیاز به شبکه خارجی
export class MockDatabase {
  items: Map<string, PayPassItem> = new Map();
  orders: Map<string, PayPassOrder> = new Map();

  reset() {
    this.items.clear();
    this.orders.clear();
  }

  insertItem(item: PayPassItem) {
    this.items.set(item.id, item);
  }

  getItem(id: string): PayPassItem | undefined {
    return this.items.get(id);
  }

  insertOrder(order: PayPassOrder) {
    this.orders.set(order.id, order);
  }

  getOrder(id: string): PayPassOrder | undefined {
    return this.orders.get(id);
  }

  updateOrder(id: string, updates: Partial<PayPassOrder>): PayPassOrder | undefined {
    const current = this.orders.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    this.orders.set(id, updated);
    return updated;
  }
}

export const dbInstance = new MockDatabase();