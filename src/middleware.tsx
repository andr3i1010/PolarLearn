import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const response = NextResponse.next();

    if (pathname === '/login' || pathname === '/error') {
        response.headers.set('x-hide-navbar', 'true');
    } else {
        response.headers.set('x-hide-navbar', 'false');
    }

    // Allow the /error path to be served without redirection
    if (pathname !== '/error' && !['/login', '/'].includes(pathname) && !pathname.startsWith('/_next')) {
        const errorUrl = new URL('/error', request.url);
        errorUrl.searchParams.set('errorCode', '404');
        response.headers.set('x-hide-navbar', 'true');
        return NextResponse.redirect(errorUrl);
    }

    return response;
}

export const config = {
    matcher: '/:path*',
};