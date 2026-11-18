import { describe, it, expect, beforeEach } from "vitest";
import {
  getAdminToken,
  getAdminUser,
  isStaffAdmin,
  saveAdminAuth,
  clearAdminAuth,
} from "./admin-auth";

describe("admin-auth module", () => {
  beforeEach(() => {
    clearAdminAuth();
  });

  it("is not authenticated initially", () => {
    expect(isStaffAdmin()).toBe(false);
    expect(getAdminToken()).toBeNull();
    expect(getAdminUser()).toBeNull();
  });

  it("saves authentication in localStorage when remember is true", () => {
    saveAdminAuth("test-token-123", { name: "Admin Test", role: "super_admin" }, true);

    expect(isStaffAdmin()).toBe(true);
    expect(getAdminToken()).toBe("test-token-123");
    expect(getAdminUser()?.name).toBe("Admin Test");
    expect(localStorage.getItem("dastyor_admin_token")).toBe("test-token-123");
    expect(sessionStorage.getItem("dastyor_admin_token")).toBeNull();
  });

  it("saves authentication in sessionStorage when remember is false", () => {
    saveAdminAuth("test-token-session", { name: "Staff User", role: "admin" }, false);

    expect(isStaffAdmin()).toBe(true);
    expect(getAdminToken()).toBe("test-token-session");
    expect(getAdminUser()?.name).toBe("Staff User");
    expect(sessionStorage.getItem("dastyor_admin_token")).toBe("test-token-session");
    expect(localStorage.getItem("dastyor_admin_token")).toBeNull();
  });

  it("clears both storage engines on logout", () => {
    saveAdminAuth("token-to-clear", { name: "User", role: "admin" }, true);
    expect(isStaffAdmin()).toBe(true);

    clearAdminAuth();
    expect(isStaffAdmin()).toBe(false);
    expect(getAdminToken()).toBeNull();
    expect(getAdminUser()).toBeNull();
    expect(localStorage.getItem("dastyor_admin_token")).toBeNull();
    expect(sessionStorage.getItem("dastyor_admin_token")).toBeNull();
  });
});
