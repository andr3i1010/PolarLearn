"use client";

import { useState, useEffect, useCallback, memo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface TabItem {
    id: string;
    label: React.ReactNode;
    content: React.ReactNode;
}

interface TabsProps {
    tabs: TabItem[];
    defaultActiveTab?: string;
    withRoutes?: boolean;
    baseRoute?: string;
}

// Memoized Tab component for individual tabs
const Tab = memo(({
    id,
    label,
    isActive,
    onClick
}: {
    id: string;
    label: React.ReactNode;
    isActive: boolean;
    onClick: (id: string) => void;
}) => (
    <div
        data-tab-id={id}
        className={`p-3 cursor-pointer text-lg transition-colors duration-200 border-b-2 ${isActive
            ? "text-white"
            : "text-gray-400 border-transparent hover:text-white"
            }`}
        onClick={() => onClick(id)}
    >
        {label}
    </div>
));

Tab.displayName = "Tab";

// Memoized TabContent component
const TabContent = memo(({ content }: { content: React.ReactNode }) => (
    <div className="mt-4">{content}</div>
));

TabContent.displayName = "TabContent";

const Tabs = ({ tabs, defaultActiveTab, withRoutes = false, baseRoute = "" }: TabsProps) => {
    const [activeTabId, setActiveTabId] = useState(defaultActiveTab || (tabs.length > 0 ? tabs[0].id : ""));
    const router = useRouter();
    const pathname = usePathname();
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const isFirstMount = useRef(true);
    const isNavigating = useRef(false);
    const lastKnownPositions = useRef<Record<string, { left: number, width: number }>>({});
    const ignorePathChange = useRef(false);

    // Store positions of all tabs on mount and resize for smoother transitions
    const storeAllTabPositions = useCallback(() => {
        if (!tabsContainerRef.current) return;

        tabs.forEach(tab => {
            const tabElement = tabsContainerRef.current?.querySelector(`[data-tab-id="${tab.id}"]`) as HTMLElement;
            if (tabElement) {
                lastKnownPositions.current[tab.id] = {
                    left: tabElement.offsetLeft,
                    width: tabElement.offsetWidth
                };
            }
        });
    }, [tabs]);

    // Position indicator directly without animation interruptions
    const positionIndicator = useCallback((tabId: string, animate = true) => {
        if (!indicatorRef.current) return;

        // Get position from cache if available, otherwise try to measure
        let position = lastKnownPositions.current[tabId];

        // If no cached position, try to measure (but don't break if element isn't there)
        if (!position && tabsContainerRef.current) {
            const tabElement = tabsContainerRef.current.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement;
            if (tabElement) {
                position = {
                    left: tabElement.offsetLeft,
                    width: tabElement.offsetWidth
                };
                // Cache for future use
                lastKnownPositions.current[tabId] = position;
            } else {
                // If we can't find the element, use last known good position or default
                position = { left: 0, width: 0 };
            }
        }

        // Set transition (or disable it for immediate positioning)
        if (animate && !isNavigating.current) {
            indicatorRef.current.style.transition = 'left 500ms cubic-bezier(0.25, 1, 0.5, 1), width 500ms cubic-bezier(0.25, 1, 0.5, 1), opacity 250ms ease';
        } else {
            indicatorRef.current.style.transition = 'none';
        }

        // Update position
        indicatorRef.current.style.left = `${position.left}px`;
        indicatorRef.current.style.width = `${position.width}px`;
        indicatorRef.current.style.opacity = '1';

        // Force reflow if needed
        if (!animate) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            indicatorRef.current.offsetWidth;
            // Restore transition
            indicatorRef.current.style.transition = 'left 500ms cubic-bezier(0.25, 1, 0.5, 1), width 500ms cubic-bezier(0.25, 1, 0.5, 1), opacity 250ms ease';
        }
    }, []);

    // Initial setup on mount
    useEffect(() => {
        if (isFirstMount.current) {
            // Store all tab positions first
            setTimeout(() => {
                storeAllTabPositions();

                // Then position the indicator without animation
                positionIndicator(activeTabId, false);
                isFirstMount.current = false;
            }, 50);
        }
    }, [activeTabId, positionIndicator, storeAllTabPositions]);

    // Handle window resize - update all tab positions
    useEffect(() => {
        const handleResize = () => {
            if (isNavigating.current) return;

            storeAllTabPositions();
            if (activeTabId) positionIndicator(activeTabId, false);
        };

        // Debounced resize handler
        let resizeTimer: NodeJS.Timeout | null = null;
        const debouncedResize = () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(handleResize, 100);
        };

        window.addEventListener('resize', debouncedResize);
        return () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            window.removeEventListener('resize', debouncedResize);
        };
    }, [activeTabId, positionIndicator, storeAllTabPositions]);

    // Update indicator on tab change (only when not navigating)
    useEffect(() => {
        if (!isFirstMount.current && !isNavigating.current) {
            positionIndicator(activeTabId, true);
        }
    }, [activeTabId, positionIndicator]);

    // Handle URL changes, but ignore during navigation
    useEffect(() => {
        if (!withRoutes || isFirstMount.current || ignorePathChange.current) {
            ignorePathChange.current = false;
            return;
        }

        // Get tab from URL
        const pathParts = pathname.split('/');
        const lastPartWithQuery = pathParts[pathParts.length - 1];
        const urlTabId = lastPartWithQuery.split('?')[0];

        // Check if it's a valid tab
        if (tabs.some(tab => tab.id === urlTabId) && urlTabId !== activeTabId) {
            setActiveTabId(urlTabId);
        }
    }, [pathname, tabs, withRoutes, activeTabId]);

    // Handle tab click with optimized routing
    const handleTabChange = useCallback((tabId: string) => {
        if (tabId === activeTabId || isNavigating.current) return;

        // Get query parameters
        const queryParams = pathname.includes('?') ? '?' + pathname.split('?')[1] : '';

        // Update local state first
        setActiveTabId(tabId);

        // Position the indicator immediately for smooth animation
        positionIndicator(tabId, true);

        // Handle routing if enabled
        if (withRoutes) {
            // Set navigating flag to block any interfering updates
            isNavigating.current = true;

            // Set flag to ignore the next path change (to prevent double updates)
            ignorePathChange.current = true;

            // Create URL with preserved query params
            const newUrl = `${baseRoute}/${tabId}${queryParams}`;

            // Complete the animation before route change
            setTimeout(() => {
                // Store the position we're currently at before navigation
                if (indicatorRef.current) {
                    // Ensure the indicator stays visible during navigation
                    indicatorRef.current.style.transition = 'none';

                    // Use shallow routing instead of full navigation
                    // This updates the URL without triggering a full page re-render
                    window.history.pushState({}, '', newUrl);

                    // We don't actually navigate with router.push, so indicator position is preserved

                    // Update any query params or handle state changes that would normally happen with navigation
                    setTimeout(() => {
                        // Re-enable transitions
                        if (indicatorRef.current) {
                            indicatorRef.current.style.transition = 'left 500ms cubic-bezier(0.25, 1, 0.5, 1), width 500ms cubic-bezier(0.25, 1, 0.5, 1), opacity 250ms ease';
                        }

                        // End navigation mode
                        isNavigating.current = false;
                    }, 300);
                } else {
                    // For fallback, use history API
                    window.history.pushState({}, '', newUrl);
                }

                // End navigation mode after transition completes with longer delay
                setTimeout(() => {
                    if (indicatorRef.current) {
                        // Re-enable transitions only after navigation is complete
                        indicatorRef.current.style.transition = 'left 500ms cubic-bezier(0.25, 1, 0.5, 1), width 500ms cubic-bezier(0.25, 1, 0.5, 1), opacity 250ms ease';
                    }

                    // Mark navigation as complete after all transitions are done
                    isNavigating.current = false;

                    // We don't need to reposition the indicator again here - it's already in the correct place
                }, 500); // Longer delay to ensure route change is complete
            }, 300); // Complete animation before navigating
        }
    }, [activeTabId, positionIndicator, withRoutes, router, baseRoute, pathname]);

    // Find the active tab
    const activeTab = tabs.find(tab => tab.id === activeTabId);

    return (
        <>
            <div className="flex border-b border-neutral-700 mb-1 text-sm md:text-md font-medium relative" ref={tabsContainerRef}>
                {tabs.map((tab) => (
                    <Tab
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        isActive={tab.id === activeTabId}
                        onClick={handleTabChange}
                    />
                ))}
                <div
                    ref={indicatorRef}
                    className="absolute bottom-0 h-0.5 bg-sky-400 rounded-4xl"
                    style={{
                        left: 0,
                        width: 0,
                        opacity: 0,
                        transform: 'translateZ(0)',
                        willChange: 'left, width, opacity',
                        backfaceVisibility: 'hidden',
                        pointerEvents: 'none',
                        transition: 'left 500ms cubic-bezier(0.25, 1, 0.5, 1), width 500ms cubic-bezier(0.25, 1, 0.5, 1), opacity 250ms ease'
                    }}
                />
            </div>
            {activeTab && <TabContent content={activeTab.content} />}
        </>
    );
};

export default memo(Tabs);
