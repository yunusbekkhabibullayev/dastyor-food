import { describe, expect, it } from "vitest";
import { isFirebaseConfigured, app, auth, db, storage } from "./firebase";

describe("Firebase module", () => {
  it("exports configuration state and instances", () => {
    expect(typeof isFirebaseConfigured).toBe("boolean");
  });

  it("handles empty credentials safely without crashing", () => {
    // Should not throw or crash SSR/tests
    expect(app === null || typeof app === "object").toBe(true);
    expect(auth === null || typeof auth === "object").toBe(true);
    expect(db === null || typeof db === "object").toBe(true);
    expect(storage === null || typeof storage === "object").toBe(true);
  });
});

