import { useState, useEffect, useRef } from 'react';

/**
 * Hook that returns a debounced version of the value
 * Useful for inputs that trigger expensive operations
 */
export function useDebouncedValue<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set a new timeout
        timeoutRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup on unmount or when value/delay changes
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, delay]);

    return debouncedValue;
}
