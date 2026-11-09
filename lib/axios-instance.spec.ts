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
