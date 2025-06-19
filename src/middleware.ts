import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { decodeCookie } from '@/utils/auth/session';
import { prisma } from '@/utils/prisma';

export async function middleware(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
    let cspHeader = '';
    if (process.env.DISABLE_CSP) {
        // Set an empty CSP header when disabled
        cspHeader = '';
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
        upgrade-insecure-requests;`
    }
    const contentSecurityPolicyHeaderValue = cspHeader
        .replace(/\s{2,}/g, ' ')
        .trim()
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)

    // Check for server actions and validate nonce
    const serverActionResponse = await handleServerActions(request);
    if (serverActionResponse) {
        return serverActionResponse;
    }

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
    // Check for UTM source and set cookie if it's 'studygo'
    const utmSource = request.nextUrl.searchParams.get('utm_source');
    if (utmSource === 'studygo') {
        // Set cookie to track the source - expires in 30 days
        resp.cookies.set('SG', 'true', {
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
    }
    return resp;
}

async function middlewareAuth(request: NextRequest) {
    if (
        request.nextUrl.pathname.startsWith("/home") ||
        request.nextUrl.pathname.startsWith("/learn")
    ) {
        // Get the cookie directly from the request instead of using cookies()
        const sessionCookie = request.cookies.get('polarlearn.session-id');

        if (!sessionCookie?.value) {
            request.cookies.set('polarlearn.goto', request.nextUrl.pathname)
            return NextResponse.redirect(new URL('/auth/sign-in', request.url));
        }

        try {
            const sessionId = await decodeCookie(sessionCookie.value);

            if (!sessionId) {
                request.cookies.set('polarlearn.goto', request.nextUrl.pathname)
                return NextResponse.redirect(new URL('/auth/sign-in', request.url));
            }

            const session = await prisma.session.findUnique({
                where: { sessionID: sessionId }
            });

            if (!session || session.expires < new Date()) {
                request.cookies.set('polarlearn.goto', request.nextUrl.pathname)
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

async function handleServerActions(request: NextRequest) {
    // Check if this is a server action request
    if (request.method === 'POST' && isServerAction(request)) {
        // Get the nonce from the cookie
        const nonceCookie = request.cookies.get('polarlearn.nonce.NIET_BEWERKEN!!');

        if (!nonceCookie?.value) {
            // No nonce - clear session and redirect to sign-in
            try {
                // Try to get and clear the session if it exists
                const sessionCookie = request.cookies.get('polarlearn.session-id');
                if (sessionCookie?.value) {
                    const sessionId = await decodeCookie(sessionCookie.value);
                    if (sessionId) {
                        // Delete the session from database
                        await prisma.session.deleteMany({
                            where: { sessionID: sessionId }
                        });
                    }
                }
            } catch (clearError) {
                console.error('Error clearing session for missing nonce:', clearError);
            }

            // Create response with redirect and clear cookies
            const response = NextResponse.redirect(new URL('/auth/sign-in', request.url));
            response.cookies.delete('polarlearn.session-id');
            response.cookies.delete('polarlearn.nonce.NIET_BEWERKEN!!');
            return response;
        }

        try {
            // Validate the nonce
            const nonce = await prisma.nonce.findUnique({
                where: { nonce: nonceCookie.value }
            }); if (!nonce) {
                // Instead of immediately banning, clear session and redirect to sign-in
                // This gives users a chance to re-authenticate rather than getting banned
                try {
                    const sessionCookie = request.cookies.get('polarlearn.session-id');
                    if (sessionCookie?.value) {
                        const sessionId = await decodeCookie(sessionCookie.value);
                        if (sessionId) {
                            // Clear session from database
                            await prisma.session.deleteMany({
                                where: { sessionID: sessionId }
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error clearing session for invalid nonce:', err);
                }

                // Redirect to sign-in to get fresh session and nonce
                const response = NextResponse.redirect(new URL('/auth/sign-in?error=session_expired', request.url));
                response.cookies.delete('polarlearn.session-id');
                response.cookies.delete('polarlearn.nonce.NIET_BEWERKEN!!');
                return response;
            }

            // Nonce is valid - rotate it immediately for this server action
            try {
                const { rotateUserNonce } = await import('./utils/auth/nonce');
                await rotateUserNonce(nonce.userId);
            } catch (error) {
                console.error('Error rotating nonce:', error);
                // Don't fail the request if nonce rotation fails
            }

            // Allow the request to continue
            return null;
        } catch (error) {
            console.error('Error validating nonce:', error);
            return new NextResponse('Internal Server Error', { status: 500 });
        }
    }

    return null;
}

function isServerAction(request: NextRequest): boolean {
    // First check: exclude auth routes entirely from server action detection
    if (request.nextUrl.pathname.startsWith('/auth/')) {
        return false;
    }

    // Check for Next.js server action indicators
    const contentType = request.headers.get('content-type');
    const nextAction = request.headers.get('next-action');

    // Server actions typically have these characteristics:
    // 1. POST method
    // 2. Content-Type includes multipart/form-data or application/x-www-form-urlencoded
    // 3. next-action header is present
    // 4. Or the URL pathname suggests it's an action

    if (nextAction) {
        return true;
    }

    if (contentType && (
        contentType.includes('multipart/form-data') ||
        contentType.includes('application/x-www-form-urlencoded')
    )) {
        return true;
    }

    return false;
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
