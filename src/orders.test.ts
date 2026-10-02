import { getOrders, getPharmacySummary } from "./orders";

it("should get order asynchronously", async () => {
  const orders = await getOrders();
  console.log("Orders:", JSON.stringify(orders, null, 2));
  expect(orders).toBeDefined();
  expect(orders.length).toBeGreaterThan(0);
});

it("should summarize orders correctly", () => {
  const summaries = getPharmacySummary();
  console.log("Pharmacy Summaries:", JSON.stringify(summaries, null, 2));
  expect(summaries).toBeDefined();
  expect(summaries.length).toBeGreaterThan(0);
});
