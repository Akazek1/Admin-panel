import { beforeEach, describe, expect, it } from "vitest";
import { clearAllDrafts, readDraft, writeDraft } from "./drafts";

describe("chat drafts", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("keeps a draft per conversation", () => {
    writeDraft("support", "t1", "hello");
    writeDraft("support", "t2", "other");
    expect(readDraft("support", "t1")).toBe("hello");
    expect(readDraft("support", "t2")).toBe("other");
  });

  it("keeps the two chat pages apart", () => {
    writeDraft("support", "same-id", "hello");
    expect(readDraft("conversations", "same-id")).toBe("");
  });

  it("forgets a draft once the text is empty", () => {
    writeDraft("support", "t1", "hello");
    writeDraft("support", "t1", "");
    expect(readDraft("support", "t1")).toBe("");
    expect(window.sessionStorage.length).toBe(0);
  });

  it("has nothing for no conversation", () => {
    writeDraft("support", null, "hello");
    expect(readDraft("support", null)).toBe("");
    expect(window.sessionStorage.length).toBe(0);
  });

  it("clears every draft and nothing else", () => {
    writeDraft("support", "t1", "hello");
    writeDraft("conversations", "c1", "hi");
    window.sessionStorage.setItem("admin-users-list", "{}");
    clearAllDrafts();
    expect(readDraft("support", "t1")).toBe("");
    expect(readDraft("conversations", "c1")).toBe("");
    expect(window.sessionStorage.getItem("admin-users-list")).toBe("{}");
  });
});
