import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = ["/auth/login"];

type JwtPayload = {
  exp?: number;
  roles?: string[];
};

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlToJson<T>(value: string): T | null {
  try {
    const bytes = base64UrlToBytes(value);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

async function verifyAdminJwt(token: string): Promise<boolean> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

  if (!secret || !encodedHeader || !encodedPayload || !encodedSignature) {
    return false;
  }

  const header = base64UrlToJson<{ alg?: string; typ?: string }>(encodedHeader);
  const payload = base64UrlToJson<JwtPayload>(encodedPayload);

  if (!header || header.alg !== "HS256" || !payload) {
    return false;
  }

  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  if (!payload.roles?.some((role) => role === "ADMIN" || role === "SUB_ADMIN")) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );
}

function clearAuthAndRedirect(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/auth/login", request.url));
  response.cookies.delete("access_token");
  return response;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  const path = request.nextUrl.pathname;

  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  if (!token) {
    return clearAuthAndRedirect(request);
  }

  const isValidAdminToken = await verifyAdminJwt(token);
  if (!isValidAdminToken) {
    return clearAuthAndRedirect(request);
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Apply to all routes except static files and Next.js internals
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
