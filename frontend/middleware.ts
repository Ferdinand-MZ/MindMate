import { NextRequest, NextResponse } from "next/server";

// Routes that require login
const PROTECTED = ["/journal", "/community", "/dashboard"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!isProtected) return NextResponse.next();

  // Next.js middleware runs on the Edge : localStorage is not available.
  // We rely on a cookie ("token") that is set alongside localStorage on login.
  const token = req.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/journal/:path*", "/community/:path*", "/dashboard/:path*"],
};