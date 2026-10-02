export type LoyaltyTier = "none" | "silver" | "gold";
export type ItemType = "rx" | "otc"; // prescription / over the counter

export interface CartItem {
  sku: string;
  price: number; // CHF, net of VAT
  qty: number;
  type: ItemType;
}

export interface Cart {
  items: CartItem[];
  loyalty: LoyaltyTier;
}

/** A discount rule returns the multiplier for one line (1 = no discount). */
export type DiscountRule = (item: CartItem, cart: Cart, date: Date) => number;

const VAT_RATE = 0.081;
const BIG_CART_THRESHOLD_CHF = 100;
const BIG_CART_REBATE_CHF = 5;

const LOYALTY_DISCOUNT: Record<LoyaltyTier, number> = { none: 0, silver: 0.05, gold: 0.1 };

const DECEMBER = 11; // Date#getMonth() is zero-based
const DECEMBER_DISCOUNT = 0.05;

const BULK_MIN_QTY = 3;
const BULK_DISCOUNT = 0.1;

export const loyaltyDiscount: DiscountRule = (_item, cart) =>
  1 - LOYALTY_DISCOUNT[cart.loyalty];

export const decemberPromotion: DiscountRule = (_item, _cart, date) =>
  date.getMonth() === DECEMBER ? 1 - DECEMBER_DISCOUNT : 1;

/** Step 3, the new rule: 10% off a line when buying 3 or more of the same item. */
export const bulkDiscount: DiscountRule = item =>
  item.qty >= BULK_MIN_QTY ? 1 - BULK_DISCOUNT : 1;

/** Exactly the rules the legacy code had, in the same order. */
export const LEGACY_RULES: readonly DiscountRule[] = [loyaltyDiscount, decemberPromotion];
export const DEFAULT_RULES: readonly DiscountRule[] = [...LEGACY_RULES, bulkDiscount];

function lineTotal(item: CartItem, cart: Cart, date: Date, rules: readonly DiscountRule[]): number {
  const gross = item.price * item.qty;
  if (item.type === "rx") return gross; // prescriptions are never discounted

  return rules.reduce((amount, rule) => amount * rule(item, cart, date), gross);
}

const roundToCents = (chf: number): number => Math.round(chf * 100) / 100;

export function calculateTotal(
  cart: Cart,
  date: Date,
  rules: readonly DiscountRule[] = DEFAULT_RULES,
): number {
  const net = cart.items.reduce((sum, item) => sum + lineTotal(item, cart, date, rules), 0);
  const afterRebate = net > BIG_CART_THRESHOLD_CHF ? net - BIG_CART_REBATE_CHF : net;
  return roundToCents(afterRebate * (1 + VAT_RATE));
}
