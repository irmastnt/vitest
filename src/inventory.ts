export interface ReservationLine {
  sku: string;
  qty: number;
}

export class InsufficientStockError extends Error {
  constructor(
    public readonly sku: string,
    public readonly requested: number,
    public readonly available: number,
  ) {
    super(`Insufficient stock for ${sku}: requested ${requested}, available ${available}`);
    this.name = "InsufficientStockError";
  }
}

export class Inventory {
  /** Unreserved quantity per SKU. */
  private readonly stock = new Map<string, number>();
  /** What each order is currently holding, so it can be released. */
  private readonly reservations = new Map<string, ReservationLine[]>();

  addStock(sku: string, qty: number): void {
    assertPositiveInteger(qty);
    this.stock.set(sku, this.available(sku) + qty);
  }

  available(sku: string): number {
    return this.stock.get(sku) ?? 0;
  }

  /** Step 1: single-SKU reservation is just the multi-SKU case with one line. */
  reserve(orderId: string, sku: string, qty: number): void {
    this.reserveMany(orderId, [{ sku, qty }]);
  }

  /**
   * Step 2: all-or-nothing. Every line is validated before any stock changes,
   * so a failure leaves the inventory untouched. JS is single-threaded, so
   * "validate then apply" in one synchronous call cannot be interleaved.
   */
  reserveMany(orderId: string, lines: ReservationLine[]): void {
    if (this.reservations.has(orderId)) {
      throw new Error(`Order ${orderId} already has a reservation`);
    }
    if (lines.length === 0) {
      throw new Error("A reservation needs at least one line");
    }

    const requested = mergeLines(lines);

    for (const [sku, qty] of requested) {
      const available = this.available(sku);
      if (available < qty) throw new InsufficientStockError(sku, qty, available);
    }

    for (const [sku, qty] of requested) {
      this.stock.set(sku, this.available(sku) - qty);
    }
    this.reservations.set(
      orderId,
      [...requested].map(([sku, qty]) => ({ sku, qty })),
    );
  }

  /** Returns false if the order had nothing reserved (safe to call twice). */
  release(orderId: string): boolean {
    const lines = this.reservations.get(orderId);
    if (!lines) return false;

    for (const { sku, qty } of lines) {
      this.stock.set(sku, this.available(sku) + qty);
    }
    this.reservations.delete(orderId);
    return true;
  }
}

/** Validates each line and combines duplicate SKUs ("A x2" + "A x3" => "A x5"). */
function mergeLines(lines: ReservationLine[]): Map<string, number> {
  const merged = new Map<string, number>();
  for (const { sku, qty } of lines) {
    assertPositiveInteger(qty);
    merged.set(sku, (merged.get(sku) ?? 0) + qty);
  }
  return merged;
}

function assertPositiveInteger(qty: number): void {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new RangeError(`Quantity must be a positive integer, got ${qty}`);
  }
}
