import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = ["/auth/login"];

export function middleware(request: NextRequest) {
  // Get the token from cookies
  const token = request.cookies.get("access_token")?.value;

  // Get the current path
  const path = request.nextUrl.pathname;

  // If it's a public route, allow access
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // If token exists, allow the request to proceed
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Apply to all routes except static files and Next.js internals
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
