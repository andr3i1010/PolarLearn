import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isMaintenance = process.env.MAINTENANCE_MODE === "true";
    
    const currentPath = pathname;
    const response = NextResponse.next();
    response.headers.set('x-current-path', currentPath);
    if (response.status >= 400 && response.status < 600) {
        const errorUrl = new URL('/error', request.url);
        return NextResponse.redirect(errorUrl);
    }
    return response;
}

export const config = {
    matcher: '/:path*',
};