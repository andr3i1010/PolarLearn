import { memo, type ComponentType, type FunctionComponent, type MemoExoticComponent } from 'react';

/**
 * Custom memo utility with a better display name for debugging
 */
export function memoWithName<T extends ComponentType<any>>(
    component: T,
    customCompare?: (prevProps: any, nextProps: any) => boolean
): MemoExoticComponent<T> {
    const memoized = memo(component, customCompare);
    // Better component names in React DevTools
    memoized.displayName = `Memo(${component.displayName || component.name})`;
    return memoized;
}

/**
 * Custom comparison function that ignores specific props
 */
export function createPropsComparator(propsToIgnore: string[]) {
    return (prevProps: any, nextProps: any) => {
        const keys = Object.keys(prevProps).filter(key => !propsToIgnore.includes(key));
        return keys.every(key => prevProps[key] === nextProps[key]);
    };
}

/**
 * Wraps components with memo and adds debugging information
 */
export function withMemo<P>(Component: FunctionComponent<P>) {
    const WrappedComponent = memo(Component);
    WrappedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
    return WrappedComponent;
}
