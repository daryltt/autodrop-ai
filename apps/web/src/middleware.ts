import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth.config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const { auth } = NextAuth(edgeAuthConfig);

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export default auth(function middleware(req) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api/auth/")) {
    const ip = getClientIp(req);
    const result = checkRateLimit(`auth:${ip}`, 20, 60_000);

    if (!result.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Too many authentication requests. Please try again later." },
          { status: 429 }
        )
      );
    }
  }

  // `req.auth` is the validated session from the JWT — not just cookie presence.
  if (pathname.startsWith("/dashboard") && !req.auth?.user) {
    const signInUrl = new URL("/auth/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return applySecurityHeaders(NextResponse.redirect(signInUrl));
  }

  return applySecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/auth/:path*"]
};
