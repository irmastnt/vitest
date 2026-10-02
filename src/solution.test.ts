
import { sum } from "./solution";

describe ("sum function", () => {
  it("should return the sum of two numbers", () => {
    expect(sum(2, 3)).toBe(5);
  });
});