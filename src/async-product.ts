export async function getProductName(productId: number): Promise<string> {
  if (productId <= 0) throw new Error("Invalid product ID");

  return `Product ${productId}`;
}
