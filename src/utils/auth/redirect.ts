/**
 * Utility functions for handling authentication redirects
 */

/**
 * Validates if a redirect path is safe to use
 * @param path - The path to validate
 * @returns The validated path or a default safe path
 */
export function getValidRedirectPath(path: string | null | undefined): string {
    // Default redirect path
    const defaultPath = '/home/start';

    // If no path provided, use default
    if (!path) {
        return defaultPath;
    }

    // Ensure the path is relative (not absolute URL)
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
        return defaultPath;
    }

    // Ensure the path starts with /
    if (!path.startsWith('/')) {
        path = '/' + path;
    }

    // Blacklist certain paths for security
    const blockedPaths = ['/api/', '/auth/sign-out'];
    if (blockedPaths.some(blocked => path.startsWith(blocked))) {
        return defaultPath;
    }

    return path;
}

/**
 * Clears the redirect cookie from the client side
 */
export function clearRedirectCookie(): void {
    if (typeof document !== 'undefined') {
        document.cookie = 'polarlearn.goto=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
}
