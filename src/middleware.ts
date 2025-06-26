import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { decodeCookie } from "@/utils/auth/session";
import { prisma } from "@/utils/prisma";
import { getTourState } from "./serverActions/getTourState";
import { getUserFromSession } from "./utils/auth/auth";

export async function middleware(request: NextRequest, response: NextResponse) {
  let cspHeader = "";
  if (process.env.DISABLE_CSP) {
    // Set an empty CSP header when disabled
    cspHeader = "";
  } else {
    cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' ${process.env.NEXT_PUBLIC_URL} https://*.cloudflare.com https://*.sentry.io https://*.google.com;
        worker-src 'self' blob:;
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: *;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        connect-src 'self' ${process.env.NEXT_PUBLIC_URL} https://*.cloudflare.com https://*.sentry.io https://*.google.com *;
        upgrade-insecure-requests;`;
  }
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();
  const requestHeaders = new Headers(request.headers);
  // Get response from auth middleware or create a new response
  const resp =
    (await middlewareAuth(request, response)) ??
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  // Apply the CSP header to the response
  resp.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);
  // Also set the Report-Only header to debug without breaking functionality
  resp.headers.set(
    "Content-Security-Policy-Report-Only",
    contentSecurityPolicyHeaderValue
  );

  // Make sure headers get applied
  resp.headers.set("X-Content-Type-Options", "nosniff");
  // Check for UTM source and set cookie if it's 'studygo'
  const utmSource = request.nextUrl.searchParams.get("utm_source");
  if (utmSource === "studygo") {
    // Set cookie to track the source - expires in 30 days
    resp.cookies.set("SG", "true", {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }
  const { finishedTour } = await getTourState();
  if (
    !finishedTour &&
    request.nextUrl.pathname !== "/home/start" &&
    !request.nextUrl.pathname.startsWith("/api") &&
    !request.headers.get("Next-Url") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    request.nextUrl.pathname !== "/" &&
    await getUserFromSession(request.cookies.get("polarlearn.session-id")?.value)
  ) {
    return NextResponse.redirect(new URL("/home/start", request.url));
  }

  return resp;
}

async function middlewareAuth(request: NextRequest, response: NextResponse) {
  if (
    request.nextUrl.pathname.startsWith("/home") ||
    request.nextUrl.pathname.startsWith("/learn")
  ) {
    // Get the cookie directly from the request instead of using cookies()
    const sessionCookie = request.cookies.get("polarlearn.session-id");

    if (!sessionCookie?.value) {
      const response = NextResponse.redirect(
        new URL("/auth/sign-in", request.url)
      );
      
      // Don't set goto cookie for prefetch requests
      if (!request.headers.get("Next-Router-Prefetch")) {
        response.cookies.set("polarlearn.goto", request.nextUrl.pathname, {
          path: "/",
          maxAge: 10 * 60, // 10 minutes
          httpOnly: false, // Allow client-side access
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
      
      return response;
    }

    try {
      const sessionId = await decodeCookie(sessionCookie.value);

      if (!sessionId && !request.headers.get("Next-Url")) {
        const response = NextResponse.redirect(
          new URL("/auth/sign-in", request.url)
        );
        
        // Don't set goto cookie for prefetch requests
        if (!request.headers.get("Next-Router-Prefetch")) {
          response.cookies.set("polarlearn.goto", request.nextUrl.pathname, {
            path: "/",
            maxAge: 10 * 60, // 10 minutes
            httpOnly: false, // Allow client-side access
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          });
        }
        
        return response;
      }

      const session = await prisma.session.findUnique({
        where: { sessionID: sessionId as string },
      });

      if (!session || session.expires < new Date()) {
        const response = NextResponse.redirect(
          new URL("/auth/sign-in", request.url)
        );
        
        // Don't set goto cookie for prefetch requests
        if (!request.headers.get("Next-Router-Prefetch")) {
          response.cookies.set("polarlearn.goto", request.nextUrl.pathname, {
            path: "/",
            maxAge: 10 * 60, // 10 minutes
            httpOnly: false, // Allow client-side access
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          });
        }
        
        return response;
      }

      // Session is valid, allow the request
      return NextResponse.next();
    } catch (error) {
      console.error("Authentication error in middleware:", error);
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }
  }
}
export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
