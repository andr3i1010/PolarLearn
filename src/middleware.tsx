// middleware.tsx
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

<<<<<<< Updated upstream
=======
// Define paths where the Navbar should be visible
const allowedPaths = ['/', '/api', '/sign-in', '/sign-up', '/adm', '/error', '/404'];
const showNav = ['/', '/home'];

>>>>>>> Stashed changes
export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const response = NextResponse.next();

<<<<<<< Updated upstream
    if (pathname === '/login' || pathname === '/error') {
        response.headers.set('x-hide-navbar', 'true');
    } else {
        response.headers.set('x-hide-navbar', 'false');
    }

    // Allow the /error path to be served without redirection
    if (pathname !== '/error' && !['/login', '/'].includes(pathname) && !pathname.startsWith('/_next')) {
=======
    // Determine if Navbar should be shown
    if (showNav.includes(pathname) || pathname.startsWith('/home/')) {
        response.headers.set('x-hide-navbar', 'false');
    } else {
        response.headers.set('x-hide-navbar', 'true');
        }

    // Redirect to /error for non-allowed paths
    if (
        !allowedPaths.includes(pathname) &&
        !pathname.startsWith('/_next') &&
        !pathname.startsWith('/api') &&
        !pathname.startsWith('/home/')
    ) {
>>>>>>> Stashed changes
        const errorUrl = new URL('/error', request.url);
        errorUrl.searchParams.set('errorCode', '404');
        response.headers.set('x-hide-navbar', 'true');
        console.log(`Redirecting to error page for path: ${pathname}`);
        return NextResponse.redirect(errorUrl);
    }

    return response;
}

export const config = {
    matcher: '/:path*',
};