import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for memoizing state updates to prevent unnecessary re-renders
 * Only updates state if the value has actually changed based on the isEqual function
 */
export function useMemoizedState<T>(
    initialValue: T,
    isEqual: (a: T, b: T) => boolean = (a, b) => a === b
): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(initialValue);
    const prevValueRef = useRef<T>(initialValue);

    const setMemoizedState = useCallback((value: T | ((prev: T) => T)) => {
        const newValue = typeof value === 'function'
            ? (value as ((prev: T) => T))(prevValueRef.current)
            : value;

        if (!isEqual(prevValueRef.current, newValue)) {
            prevValueRef.current = newValue;
            setState(newValue);
        }
    }, [isEqual]);

    useEffect(() => {
        prevValueRef.current = state;
    }, [state]);

    return [state, setMemoizedState];
}

/**
 * Custom hook for comparing objects deeply
 */
export function useDeepCompareMemoizedState<T>(initialValue: T) {
    return useMemoizedState<T>(initialValue, (a, b) => {
        if (a === b) return true;
        if (a === null || b === null) return false;
        if (typeof a !== 'object' || typeof b !== 'object') return a === b;

        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        return keysA.every(key =>
            Object.prototype.hasOwnProperty.call(b, key) &&
            // @ts-ignore
            a[key] === b[key]
        );
    });
}
