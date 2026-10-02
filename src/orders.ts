import { orders } from "./orders-data";

export type OrderStatus = "delivered" | "cancelled" | "pending";

export interface OrderItem {
  sku: string;
  qty: number;
  price: number; // CHF, may have decimals
}

export interface Order {
  id: number;
  pharmacy: string;
  items: OrderItem[];
  status: OrderStatus;
}

export interface PharmacySummary {
  pharmacy: string;
  revenue: number; // CHF, exact to the cent
  topSku: string | null;
}

// Step 3: money is summed in integer cents to avoid floating-point drift
// (0.1 * 3 === 0.30000000000000004 in JS).
const toCents = (chf: number): number => Math.round(chf * 100);

interface Accumulator {
  cents: number;
  qtyBySku: Map<string, number>;
}

export async function getOrders(): Promise<any[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(orders);
    });
  });
}

export function getPharmacySummary(): PharmacySummary[] {
  const typedOrders = orders as Order[];
  return summarizeOrders(
    typedOrders
      .filter((order) => order.status !== "pending")
      .sort((a, b) => b.id - a.id), // descending
  );
}

export function summarizeOrders(orders: Order[]): PharmacySummary[] {
  const byPharmacy = new Map<string, Accumulator>();

  for (const order of orders) {
    if (order.status !== "delivered") continue; // Step 1: only delivered orders count

    let acc = byPharmacy.get(order.pharmacy);
    if (!acc) {
      acc = { cents: 0, qtyBySku: new Map() };
      byPharmacy.set(order.pharmacy, acc);
    }

    for (const item of order.items) {
      acc.cents += toCents(item.price) * item.qty;
      acc.qtyBySku.set(item.sku, (acc.qtyBySku.get(item.sku) ?? 0) + item.qty);
    }
  }

  return [...byPharmacy].map(([pharmacy, acc]) => ({
    pharmacy,
    revenue: acc.cents / 100,
    topSku: topByQuantity(acc.qtyBySku), // Step 2
  }));
}

// Highest quantity wins; ties are broken alphabetically so the result is deterministic.
function topByQuantity(qtyBySku: Map<string, number>): string | null {
  let best: string | null = null;
  let bestQty = -Infinity;

  for (const [sku, qty] of qtyBySku) {
    if (qty > bestQty || (qty === bestQty && best !== null && sku < best)) {
      best = sku;
      bestQty = qty;
    }
  }
  return best;
}
