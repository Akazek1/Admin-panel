import { beforeEach, describe, expect, it } from "vitest";
import {
  RESTORE_LOOP_WINDOW_MS,
  clearRestoreMarker,
  markRestoreSucceeded,
  shouldAttemptRestore,
} from "./session-restore";

describe("session restore loop guard", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("allows the first restore attempt", () => {
    expect(shouldAttemptRestore("/admin/users", 1_000)).toBe(true);
  });

  it("blocks a second restore for the same page right after one succeeded", () => {
    markRestoreSucceeded("/admin/users", 1_000);
    expect(shouldAttemptRestore("/admin/users", 3_000)).toBe(false);
  });

  it("allows a restore for a different page", () => {
    markRestoreSucceeded("/admin/users", 1_000);
    expect(shouldAttemptRestore("/admin/orders", 3_000)).toBe(true);
  });

  it("allows a restore again once the window has passed", () => {
    markRestoreSucceeded("/admin/users", 1_000);
    expect(
      shouldAttemptRestore("/admin/users", 1_000 + RESTORE_LOOP_WINDOW_MS),
    ).toBe(true);
  });

  it("allows a restore after the marker is cleared", () => {
    markRestoreSucceeded("/admin/users", 1_000);
    clearRestoreMarker();
    expect(shouldAttemptRestore("/admin/users", 2_000)).toBe(true);
  });

  it("ignores a corrupted marker", () => {
    window.sessionStorage.setItem("admin_session_restore", "{not json");
    expect(shouldAttemptRestore("/admin/users", 2_000)).toBe(true);
  });
});
