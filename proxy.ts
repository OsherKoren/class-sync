import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  globalRateLimit,
  authRateLimit,
  voteRateLimit,
  pushRateLimit,
} from "@/lib/rate-limit";

export async function proxy(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { pathname } = req.nextUrl;

  const { success } = await globalRateLimit.limit(ip);
  if (!success) return new NextResponse("Too Many Requests", { status: 429 });

  if (pathname.startsWith("/api/auth")) {
    const { success: ok } = await authRateLimit.limit(ip);
    if (!ok) return new NextResponse("Too Many Requests", { status: 429 });
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/family/vote")) {
    const { success: ok } = await voteRateLimit.limit(ip);
    if (!ok) return new NextResponse("Too Many Requests", { status: 429 });
  }

  if (pathname.startsWith("/api/push")) {
    const { success: ok } = await pushRateLimit.limit(ip);
    if (!ok) return new NextResponse("Too Many Requests", { status: 429 });
  }

  const isProtected =
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/family") ||
    pathname.startsWith("/student");
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/teacher") && token.role !== "TEACHER") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/family") && token.role !== "FAMILY") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/student") && token.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
