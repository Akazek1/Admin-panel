import { beforeEach, describe, expect, it } from "vitest";
import Cookies from "js-cookie";
import type { AxiosAdapter } from "axios";
import api, { tryRestoreSession } from "./axios-instance";

const b64 = (o: object) => btoa(JSON.stringify(o));
const tokenExpiringIn = (seconds: number) =>
  `${b64({ alg: "HS256" })}.${b64({ exp: Math.floor(Date.now() / 1000) + seconds })}.sig`;

const within = <T>(p: Promise<T>, ms = 2000) =>
  Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`still waiting after ${ms}ms`)), ms),
    ),
  ]);

describe("session refresh", () => {
  let sent: string[];

  beforeEach(() => {
    Cookies.remove("access_token");
    sent = [];
    const adapter: AxiosAdapter = async (config) => {
      sent.push(String(config.url));
      const data =
        config.url === "/auth/admin/refresh"
          ? { data: { token: tokenExpiringIn(3600) } }
          : {};
      return { data, status: 200, statusText: "OK", headers: {}, config };
    };
    api.defaults.adapter = adapter;
  });

  it("restores when an expired access token is still in the cookie", async () => {
    Cookies.set("access_token", tokenExpiringIn(-60));
    await expect(within(tryRestoreSession())).resolves.toBe(true);
    expect(sent).toEqual(["/auth/admin/refresh"]);
  });

  it("refreshes once before a request when the token is about to expire", async () => {
    Cookies.set("access_token", tokenExpiringIn(60));
    await within(api.get("/admin/users"));
    expect(sent).toEqual(["/auth/admin/refresh", "/admin/users"]);
  });

  it("keeps the session when the refresh fails for a reason other than 401", async () => {
    const stale = tokenExpiringIn(3600);
    Cookies.set("access_token", stale);
    api.defaults.adapter = async (config) => {
      const status = config.url === "/auth/admin/refresh" ? 503 : 401;
      throw Object.assign(new Error("fail"), { config, response: { status, data: {} } });
    };
    await expect(within(api.get("/admin/users"))).rejects.toBeTruthy();
    expect(Cookies.get("access_token")).toBe(stale);
    expect(window.location.pathname).not.toBe("/auth/login");
  });

  it("skips the refresh call when another tab already stored a fresh token", async () => {
    const rejected = tokenExpiringIn(3600);
    const fromOtherTab = tokenExpiringIn(3500);
    Cookies.set("access_token", rejected);
    let calls = 0;
    api.defaults.adapter = async (config) => {
      sent.push(String(config.url));
      if (config.url === "/admin/users" && calls++ === 0) {
        // The other tab finishes its refresh while this request is in flight.
        Cookies.set("access_token", fromOtherTab);
        throw Object.assign(new Error("401"), { config, response: { status: 401, data: {} } });
      }
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };
    await within(api.get("/admin/users"));
    expect(sent).toEqual(["/admin/users", "/admin/users"]);
  });

  it("reports failure when the refresh returns no token, even with a stale cookie", async () => {
    Cookies.set("access_token", tokenExpiringIn(-60));
    api.defaults.adapter = async (config) => ({
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
    await expect(within(tryRestoreSession())).resolves.toBe(false);
  });
});
