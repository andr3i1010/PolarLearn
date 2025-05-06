import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { decodeCookie } from '@/utils/auth/session';
import { prisma } from '@/utils/prisma';

export async function middleware(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
    const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.cloudflare.com ${process.env.NEXT_PUBLIC_URL};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' ${process.env.NEXT_PUBLIC_URL} https://*.cloudflare.com https://*.sentry.io;
    upgrade-insecure-requests;
`
    const contentSecurityPolicyHeaderValue = cspHeader
        .replace(/\s{2,}/g, ' ')
        .trim()
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)

    // Get response from auth middleware or create a new response
    const resp = (await middlewareAuth(request)) ?? NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Apply the CSP header to the response
    resp.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
    // Also set the Report-Only header to debug without breaking functionality
    resp.headers.set('Content-Security-Policy-Report-Only', contentSecurityPolicyHeaderValue);

    // Make sure headers get applied
    resp.headers.set('X-Content-Type-Options', 'nosniff');

    return resp;
}

async function middlewareAuth(request: NextRequest) {
    if (
        request.nextUrl.pathname.startsWith("/home") ||
        request.nextUrl.pathname.startsWith("/learn") ||
        request.nextUrl.pathname.startsWith("/admin")
    ) {
        // Get the cookie directly from the request instead of using cookies()
        const sessionCookie = request.cookies.get('polarlearn.session-id');

        if (!sessionCookie?.value) {
            return NextResponse.redirect(new URL('/auth/sign-in', request.url));
        }

        try {
            // Decode the cookie to get the session ID
            const sessionId = await decodeCookie(sessionCookie.value);

            if (!sessionId) {
                return NextResponse.redirect(new URL('/auth/sign-in', request.url));
            }

            // Check if the session exists and is valid
            const session = await prisma.session.findUnique({
                where: { sessionID: sessionId }
            });

            if (!session || session.expires < new Date()) {
                return NextResponse.redirect(new URL('/auth/sign-in', request.url));
            }

            // Session is valid, allow the request
            return NextResponse.next();
        } catch (error) {
            console.error("Authentication error in middleware:", error);
            return NextResponse.redirect(new URL('/auth/sign-in', request.url));
        }
    }
}

export const config = {
    runtime: "nodejs",
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        {
            source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
};
