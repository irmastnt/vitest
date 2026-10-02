import { getProductName } from "./async-product";

it("should return the product name for a valid product ID", async () => {
  const productName = await getProductName(1);
  expect(productName).toBe("Product 1");
});

it("should throw an error for an invalid product ID", async () => {
  const productPromise = getProductName(-1);
  await expect(productPromise).rejects.toThrow();
});
