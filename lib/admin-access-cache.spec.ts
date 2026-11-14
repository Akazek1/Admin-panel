import Cookies from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminAccess } from "./admin-access";
import {
  ACCESS_CACHE_MAX_AGE_MS,
  clearCachedAccess,
  readCachedAccess,
  writeCachedAccess,
} from "./admin-access-cache";

const access: AdminAccess = {
  isOwner: false,
  isStaff: true,
  roleId: "r1",
  roleName: "Support",
  displayName: "Test Staff",
  email: "staff@example.test",
  permissions: ["support.view"],
  extraPermissions: [],
  mustChangePassword: false,
};

function signInAs(sub: string) {
  const payload = btoa(JSON.stringify({ sub })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  Cookies.set("access_token", `h.${payload}.s`);
}

describe("admin access cache", () => {
  beforeEach(() => {
    // The shared setup replaces localStorage with no-op mocks; this suite
    // needs one that actually stores.
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    });
    Cookies.remove("access_token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns what was stored for the signed-in account", () => {
    signInAs("user-1");
    writeCachedAccess(access, 1_000);
    expect(readCachedAccess(2_000)).toEqual(access);
  });

  it("returns nothing for a different account", () => {
    signInAs("user-1");
    writeCachedAccess(access, 1_000);
    signInAs("user-2");
    expect(readCachedAccess(2_000)).toBeUndefined();
  });

  it("returns nothing when signed out", () => {
    signInAs("user-1");
    writeCachedAccess(access, 1_000);
    Cookies.remove("access_token");
    expect(readCachedAccess(2_000)).toBeUndefined();
  });

  it("drops a copy older than the session can be", () => {
    signInAs("user-1");
    writeCachedAccess(access, 1_000);
    expect(readCachedAccess(1_000 + ACCESS_CACHE_MAX_AGE_MS + 1)).toBeUndefined();
  });

  it("never remembers a no-access answer", () => {
    signInAs("user-1");
    writeCachedAccess(access, 1_000);
    writeCachedAccess({ ...access, isStaff: false }, 1_500);
    expect(readCachedAccess(2_000)).toBeUndefined();
  });

  it("ignores a corrupted entry", () => {
    signInAs("user-1");
    window.localStorage.setItem("huza-admin-access-v1", "{not json");
    expect(readCachedAccess(2_000)).toBeUndefined();
  });

  it("clears on request", () => {
    signInAs("user-1");
    writeCachedAccess(access, 1_000);
    clearCachedAccess();
    expect(readCachedAccess(2_000)).toBeUndefined();
  });
});
