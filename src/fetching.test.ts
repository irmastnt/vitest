import { loadProducts } from "./fetching";

it("should fetch products asynchronously", async () => {
  const products = await loadProducts([2, 4], async (id) => {
    // Simulate fetching product data from an API or database
    return { id, name: `Product ${id}` };
  });
  // Simulate fetching product data from an API or database
  expect(products).toBeDefined();
  expect(products.products.length).toBeGreaterThan(0);
});
