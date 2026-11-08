import { describe, expect, it } from "vitest";
import { products } from "./mock-data";
import { recommend } from "./recommend";
describe("recommend", () => {
  it("respects budget", () => {
    expect(
      recommend(products, { craving: "", diets: [], budget: 25000 }, 50).every(
        (p) => p.price <= 25000,
      ),
    ).toBe(true);
  });
  it("excludes chicken for no-meat", () => {
    expect(
      recommend(products, { craving: "", diets: ["noMeat"], budget: null }, 50).some(
        (p) => p.category === "Tovuq",
      ),
    ).toBe(false);
  });
  it("matches craving", () => {
    expect(recommend(products, { craving: "pizza", diets: [], budget: null })[0]?.category).toBe(
      "Pizza",
    );
  });
});
