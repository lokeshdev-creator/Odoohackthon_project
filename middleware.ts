import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public files, auth routes, and public APIs pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/seed") || // Allow seed API for development convenience
    pathname.startsWith("/api/test-rules") || // Allow test-rules API for rule verification
    pathname === "/login" ||
    pathname === "/" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Get token (using secret to decrypt cookie)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "any-fallback-secret-here",
  });

  // If no token and user tries to access a protected route, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If token exists and user goes to login page, redirect to dashboard
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // RBAC Routing Access Matrix
  const role = (token.role as string) || "";

  // Vehicles Management & Maintenance: Admin, Fleet Manager
  if (
    (pathname.startsWith("/dashboard/vehicles") || pathname.startsWith("/dashboard/maintenance")) &&
    !["Admin", "Fleet Manager"].includes(role)
  ) {
    return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
  }

  // Drivers Management: Admin, Safety Officer, Fleet Manager
  if (
    pathname.startsWith("/dashboard/drivers") &&
    !["Admin", "Safety Officer", "Fleet Manager"].includes(role)
  ) {
    return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
  }

  // Trips Management: Admin, Dispatcher, Driver, Fleet Manager
  if (
    pathname.startsWith("/dashboard/trips") &&
    !["Admin", "Dispatcher", "Driver", "Fleet Manager"].includes(role)
  ) {
    return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
  }

  // Fuel, Expenses, and Reports: Admin, Financial Analyst, Fleet Manager
  if (
    (pathname.startsWith("/dashboard/fuel") ||
      pathname.startsWith("/dashboard/expenses") ||
      pathname.startsWith("/dashboard/reports")) &&
    !["Admin", "Financial Analyst", "Fleet Manager"].includes(role)
  ) {
    return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
