// src/app/middleware.ts

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    // Your logic here to detect errors (e.g., broken links, unauthorized access)
    if (request.url.includes('/protected')) {
      throw new Error('Unauthorized access');
    }

    // No error, so we pass the request through
    return NextResponse.next();
  } catch (error: unknown) {
    // Type assertion: assert that the error is an instance of Error
    if (error instanceof Error) {
      console.error('Error caught in middleware:', error.message);

      // Redirect to the error page with the error code
      return NextResponse.redirect(
        new URL(`/error?errorCode=500&errorMessage=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    // Fallback if the error is not an instance of Error
    console.error('Unknown error caught in middleware:', error);
    return NextResponse.redirect(
      new URL(`/error?errorCode=500&errorMessage=Unknown error`, request.url)
    );
  }
}

// Define the paths to apply middleware to (optional)
export const config = {
  matcher: ['/', '/home/*', '/about/*'], // You can customize this for specific paths
};