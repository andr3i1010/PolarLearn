"use client";

import { useState, useEffect, useCallback, memo, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
    currentQuery?: string;
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

const Tabs = ({
    tabs,
    defaultActiveTab,
    withRoutes = false,
    baseRoute = "",
    currentQuery
}: TabsProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initialTabId = defaultActiveTab || (tabs.length > 0 ? tabs[0].id : "");
    const [activeTabId, setActiveTabId] = useState(initialTabId);
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

        let position = lastKnownPositions.current[tabId];

        if (!position && tabsContainerRef.current) {
            const tabElement = tabsContainerRef.current.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement;
            if (tabElement) {
                position = {
                    left: tabElement.offsetLeft,
                    width: tabElement.offsetWidth
                };
                lastKnownPositions.current[tabId] = position;
            } else {
                position = { left: 0, width: 0 };
            }
        }

        if (animate && !isNavigating.current) {
            indicatorRef.current.style.transition = 'left 500ms cubic-bezier(0.25, 1, 0.5, 1), width 500ms cubic-bezier(0.25, 1, 0.5, 1), opacity 250ms ease';
        } else {
            indicatorRef.current.style.transition = 'none';
        }

        indicatorRef.current.style.left = `${position.left}px`;
        indicatorRef.current.style.width = `${position.width}px`;
        indicatorRef.current.style.opacity = '1';

        if (!animate) {
            indicatorRef.current.offsetWidth;
            indicatorRef.current.style.transition = 'left 500ms cubic-bezier(0.25, 1, 0.5, 1), width 500ms cubic-bezier(0.25, 1, 0.5, 1), opacity 250ms ease';
        }
    }, []);

    // Initial setup on mount
    useEffect(() => {
        if (isFirstMount.current) {
            setTimeout(() => {
                storeAllTabPositions();
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
        if (!isFirstMount.current && !isNavigating.current && activeTabId) {
            positionIndicator(activeTabId, true);
        }
    }, [activeTabId, positionIndicator]);

    // Handle URL changes to sync state (e.g., browser back/forward)
    useEffect(() => {
        if (isNavigating.current) {
            return;
        }

        if (!withRoutes || isFirstMount.current) {
            if (!isFirstMount.current) {
                ignorePathChange.current = false;
            }
            return;
        }

        if (ignorePathChange.current) {
            ignorePathChange.current = false;
            return;
        }

        let urlTabId: string | null = null;

        if (baseRoute === '/home/search') {
            const qParam = searchParams.get('q');
            if (qParam) {
                const parts = qParam.split('/');
                if (parts.length > 1 && parts[1]?.trim()) {
                    urlTabId = parts[1].trim();
                }
            }
        } else {
            const pathSegments = pathname.split('/');
            const potentialTabId = pathSegments[pathSegments.length - 1];
            if (pathname.startsWith(baseRoute) && tabs.some(tab => tab.id === potentialTabId)) {
                urlTabId = potentialTabId;
            }
        }

        const targetTabId = urlTabId && tabs.some(tab => tab.id === urlTabId)
            ? urlTabId
            : defaultActiveTab || (tabs.length > 0 ? tabs[0].id : "");

        if (targetTabId && targetTabId !== activeTabId) {
            setActiveTabId(targetTabId);
            positionIndicator(targetTabId, false);
        }
    }, [pathname, searchParams, tabs, withRoutes, activeTabId, baseRoute, defaultActiveTab, positionIndicator]);

    // Handle tab click with optimized routing
    const handleTabChange = useCallback((tabId: string) => {
        if (tabId === activeTabId || isNavigating.current) return;

        setActiveTabId(tabId);
        positionIndicator(tabId, true);

        if (withRoutes) {
            isNavigating.current = true;
            ignorePathChange.current = true;

            let targetUrl = '';
            if (baseRoute === '/home/search' && currentQuery !== undefined) {
                targetUrl = `${baseRoute}?q=${encodeURIComponent(currentQuery)}/${tabId}`;
            } else {
                const currentSearchParams = searchParams.toString();
                targetUrl = `${baseRoute}/${tabId}${currentSearchParams ? `?${currentSearchParams}` : ''}`;
            }

            router.push(targetUrl);

            setTimeout(() => {
                isNavigating.current = false;
            }, 50);
        }
    }, [activeTabId, withRoutes, baseRoute, router, positionIndicator, searchParams, currentQuery]);

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
