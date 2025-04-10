import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { decodeCookie } from '@/utils/auth/session';
import { prisma } from '@/utils/prisma';

export async function middleware(request: NextRequest) {
    const resp = (await middlewareAuth(request)) ?? NextResponse.next();
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
    ],
};
