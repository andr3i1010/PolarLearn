import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { isLoggedIn } from '@/utils/auth/session';

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
        const loggedIn = await isLoggedIn();
        if (loggedIn) return NextResponse.next();
        else return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }
}

export const config = {
    runtime: "nodejs",
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ],
};
