import { describe, expect, it } from "vitest";
import { bottomNavItems } from "./BottomNav";

describe("Navigation destinations", () => {
  it("keeps the requested destinations in order with game in center", () => {
    expect(bottomNavItems.map((item) => item.to)).toEqual([
      "/home",
      "/favorites",
      "/game",
      "/cart",
      "/profile",
    ]);
  });

  it("does not provide an orders tab", () => {
    expect(bottomNavItems.some((item) => String(item.to) === "/orders")).toBe(false);
  });
});
