"use client";

/**
 * Wraps a server action for safe use in client components
 * This handles the type incompatibility between server actions and client component props
 */
export function wrapServerAction<T extends (...args: any[]) => any>(
    serverAction: T
): (...args: Parameters<T>) => ReturnType<T> {
    // Return a client-compatible function wrapper around the server action
    return (...args: Parameters<T>): ReturnType<T> => {
        return serverAction(...args) as ReturnType<T>;
    };
}
