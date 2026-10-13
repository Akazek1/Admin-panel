/**
 * Link detection for chat message text, in one place.
 *
 * Uses linkify-it (the detector behind markdown-it) rather than a hand-rolled
 * regex, so bare domains ("huza.app"), trailing punctuation and brackets are
 * handled correctly. Only http(s) links are ever produced — anything else stays
 * plain text.
 *
 * Kept in sync by hand with HWA_Frontend/lib/chat-links.ts and the backend's
 * src/common/links.ts: all three must agree on what counts as a link.
 */
import LinkifyIt from "linkify-it";

// TLDs accepted for links typed WITHOUT a protocol. Deliberately a curated list
// rather than "any two letters": people often type "ok.so" or "yes.no" with no
// space, and those must not become links (or trip the moderation flag).
const BARE_DOMAIN_TLDS = [
  "com", "org", "net", "info", "biz", "edu", "gov",
  "app", "dev", "io", "co", "me", "ai", "tv", "ly", "be", "gl", "gg", "to",
  "xyz", "link", "page", "site", "online", "shop", "store", "africa",
  "rw", "ke", "ug", "tz", "bi", "cd", "za", "ng", "uk", "us", "fr", "de",
];

const linkify = new LinkifyIt()
  .tlds(BARE_DOMAIN_TLDS)
  // http(s) only: no ftp:, no protocol-relative "//host", no mailto:.
  .add("ftp:", null)
  .add("//", null)
  .add("mailto:", null)
  .set({ fuzzyLink: true, fuzzyEmail: false, fuzzyIP: false });

export type ChatLinkToken =
  | { type: "text"; text: string }
  | {
      type: "link";
      /** The link exactly as the sender typed it. */
      text: string;
      /** Normalised absolute URL, always http(s). */
      href: string;
      /** The real destination host (punycode for non-ASCII names). */
      host: string;
      /** True when the destination looks like it is hiding where it goes. */
      suspicious: boolean;
    };

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * A link is suspicious when its visible form can mislead about the destination:
 * credentials before the host ("https://bank.com@evil.io"), lookalike
 * non-ASCII characters in the name, or a raw IP address instead of a name.
 */
function isSuspicious(url: URL): boolean {
  if (url.username || url.password) return true;
  const host = url.hostname;
  if (host.split(".").some((label) => label.startsWith("xn--"))) return true;
  if (IPV4_RE.test(host) || host.startsWith("[")) return true;
  return false;
}

function parseHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Splits message text into plain-text and link tokens, in order. */
export function tokenizeChatLinks(text: string): ChatLinkToken[] {
  if (!text) return [];
  const matches = linkify.match(text);
  if (!matches) return [{ type: "text", text }];

  const tokens: ChatLinkToken[] = [];
  let cursor = 0;
  for (const match of matches) {
    // A link typed without a protocol ("huza.app") gets https, not linkify-it's
    // default of plain http.
    const url = parseHttpUrl(match.schema ? match.url : `https://${match.raw}`);
    if (!url) continue;
    if (match.index > cursor) tokens.push({ type: "text", text: text.slice(cursor, match.index) });
    tokens.push({
      type: "link",
      text: match.raw,
      href: url.href,
      host: url.hostname,
      suspicious: isSuspicious(url),
    });
    cursor = match.lastIndex;
  }
  if (cursor < text.length) tokens.push({ type: "text", text: text.slice(cursor) });
  return tokens;
}

/** True when the text contains at least one link. */
export function containsChatLink(text: string): boolean {
  return tokenizeChatLinks(text).some((token) => token.type === "link");
}
