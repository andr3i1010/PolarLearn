import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

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
        // Capture cookie header
        const cookieHeader = request.headers.get("cookie") || "";
        const result = await fetch(new URL('/api/auth/middleware', request.url), {
            method: 'PATCH',
            headers: {
                'x-internal-secret': process.env.PEPPER as string,
                cookie: cookieHeader,
            }
        });
        // console.log(await result)
        if (result.ok) return NextResponse.next();
        else return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ],
};
