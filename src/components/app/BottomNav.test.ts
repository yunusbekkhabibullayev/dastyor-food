import { describe, expect, it } from "vitest";
import { bottomNavItems } from "./BottomNav";

describe("Navigation destinations", () => {
  it("keeps exactly the four requested destinations in order", () => {
    expect(bottomNavItems.map((item) => item.to)).toEqual([
      "/home",
      "/favorites",
      "/cart",
      "/profile",
    ]);
  });

  it("does not provide an orders tab", () => {
    expect(bottomNavItems.some((item) => String(item.to) === "/orders")).toBe(false);
  });
});
