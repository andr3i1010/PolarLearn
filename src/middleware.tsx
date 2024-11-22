import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedPaths = ['/', '/api', '/sign-in', '/sign-up', '/adm', '/error'];

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const response = NextResponse.next();

    if (pathname === '/') {
        response.headers.set('x-hide-navbar', 'false');
    } else {
        response.headers.set('x-hide-navbar', 'true');
    }

    if (!allowedPaths.includes(pathname) && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
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