import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for token in cookies or Authorization header
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("Authorization")?.replace("Bearer ", "");

  const isAuthenticated = !!token;

  // Protected routes that require authentication
  const protectedRoutes = ["/profile", "/get-hired", "/book", "/checkout"];

  const isProtectedRoute = ["/", ...protectedRoutes].some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(route + "/")
  );

  // If trying to access a protected route without being logged in, redirect to onboarding
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // If trying to access onboarding while logged in, redirect to home
  if (request.nextUrl.pathname === "/onboarding" && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/",
    "/profile/:path*",
    "/get-hired/:path*",
    "/book/:path*",
    "/checkout/:path*",
    "/onboarding",
  ],
};
