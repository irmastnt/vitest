export const orders = [
  {
    id: 1,
    pharmacy: "Amavita Bern",
    items: [
      { sku: "A1", qty: 2, price: 12.5 },
      { sku: "B2", qty: 1, price: 30 },
    ],
    status: "delivered",
  },
  {
    id: 2,
    pharmacy: "Sun Store Genf",
    items: [{ sku: "A1", qty: 5, price: 12.5 }],
    status: "cancelled",
  },
  {
    id: 3,
    pharmacy: "Amavita Bern",
    items: [{ sku: "C3", qty: 1, price: 99.9 }],
    status: "delivered",
  },
  { id: 4, pharmacy: "Sun Store Genf", items: [], status: "pending" },
];
