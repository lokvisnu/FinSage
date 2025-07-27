import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value ?? "";
  
  const isLoggedIn = token && await verifyToken(token);
  
  const pathname = request.nextUrl.pathname;
  // If trying to access auth pages while logged in, redirect to dashboard
  if (isLoggedIn && (pathname.startsWith("/auth/") || pathname === "/")) {
    console.log("Middleware: Redirecting logged-in user to dashboard from:", pathname);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // If trying to access dashboard without being logged in, redirect to login
  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    console.log("Middleware: Redirecting non-logged-in user to login from:", pathname);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/"],
};
