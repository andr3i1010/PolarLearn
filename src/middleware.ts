import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const currentPath = pathname;

    // Clone the response to modify headers
    const response = NextResponse.next();

    // Set the custom header with the pathname
    response.headers.set('x-current-path', currentPath);

    return response;
}

export const config = {
    matcher: '/:path*',
};