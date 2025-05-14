"use client";

// Function to invalidate the streak data cache from client components
export function invalidateStreakCache() {
    // This is a client-side function that can be used to signal that 
    // the streak data has changed and should be refetched
    if (typeof window !== 'undefined') {
        // Create a custom event to notify all streak components
        const event = new CustomEvent('streak-data-updated');
        window.dispatchEvent(event);
    }
}
