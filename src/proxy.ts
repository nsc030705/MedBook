import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req as any;
  const pathname = nextUrl.pathname;

  // ── Routes yêu cầu đăng nhập ─────────────────────────────
  const protectedPaths = ["/dashboard", "/chat", "/doctor-profile"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !session?.user) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, nextUrl));
  }

  // ── Routes chỉ dành cho ADMIN ─────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", nextUrl));
    }
  }

  // ── Routes chỉ dành cho DOCTOR ───────────────────────────
  if (pathname.startsWith("/doctor-profile")) {
    if (session?.user?.role !== "DOCTOR" && session?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", nextUrl));
    }
  }

  // ── API Admin routes ──────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/admin/:path*",
    "/doctor-profile/:path*",
    "/api/admin/:path*",
  ],
};
