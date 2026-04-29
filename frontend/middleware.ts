// frontend/src/middleware.ts
//
// Next.js middleware runs on EVERY request before the page loads.
// We use it as an auth guard:
// - If you try to visit /dashboard or /checkin without being logged in → redirected to /login
// - If you're already logged in and visit /login or /register → redirected to /dashboard
//
// WHY MIDDLEWARE INSTEAD OF CHECKING IN EACH PAGE?
// Centralised — one place controls all auth redirects.
// Faster — runs at the edge before React even loads.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages that require login
const PROTECTED_ROUTES = ["/dashboard", "/checkin", "/companion"];

// Pages only for logged-out users
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for the auth token in cookies OR the request
  // We store the token in localStorage (client-side only), so for middleware
  // we use a cookie that we set on login. See auth-store.ts for the cookie setter.
  const token = request.cookies.get("access_token")?.value;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Not logged in, trying to access a protected page → send to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname); // remember where they were going
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in, trying to visit login/register → send to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on these paths only (not on _next/static, api routes, etc.)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
