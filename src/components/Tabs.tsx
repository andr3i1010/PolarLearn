"use client"

import { useState, useRef, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

// Interface for tab configuration
export interface TabItem {
    id: string;
    label: string;
    content: ReactNode;
}

interface UserTabsProps {
    tabs: TabItem[];
    defaultActiveTab?: string;
    withRoutes?: boolean; // enable routing
    baseRoute?: string;   // new prop for base route (e.g. "/home/forum")
}

export default function Tabs({ tabs, defaultActiveTab, withRoutes, baseRoute }: UserTabsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<string>(defaultActiveTab || (tabs.length > 0 ? tabs[0].id : ''));

    // If routing is enabled, derive active tab from URL pathname
    useEffect(() => {
        if (withRoutes && pathname) {
            const segments = pathname.split("/").filter(Boolean);
            const lastSegment = segments[segments.length - 1];
            if (tabs.some(tab => tab.id === lastSegment) && lastSegment !== activeTab) {
                setActiveTab(lastSegment);
            }
        }
    }, [pathname, withRoutes, tabs, activeTab]);

    // Prefetch each tab route for faster navigation
    useEffect(() => {
        if (withRoutes && baseRoute) {
            tabs.forEach(tab => {
                const route = `${baseRoute.replace(/\/$/, "")}/${tab.id}`;
                router.prefetch(route);
            });
        }
    }, [withRoutes, baseRoute, tabs, router]);

    // Initialize underline style with a default value
    const [underlineStyle, setUnderlineStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });
    // Ref to track if we've already measured the underline
    const hasMeasured = useRef(false);

    // Use a single ref for container and track button elements by id
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    // Function to update underline position
    const updateUnderline = () => {
        const activeButton = buttonRefs.current.get(activeTab);
        if (activeButton && containerRef.current) {
            const containerLeft = containerRef.current.getBoundingClientRect().left;
            const buttonRect = activeButton.getBoundingClientRect();
            setUnderlineStyle({
                width: buttonRect.width,
                left: buttonRect.left - containerLeft
            });
            if (!hasMeasured.current) {
                hasMeasured.current = true;
            }
        }
    };

    // Update underline position based on active tab
    useEffect(() => {
        // Introduce a small delay to allow the DOM to update
        setTimeout(() => {
            updateUnderline();
        }, 50); // Adjust the delay as needed
    }, [activeTab]);

    // Update underline on window resize
    useEffect(() => {
        const handleResize = () => {
            updateUnderline();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTab]);

    return (
        <>
            <div ref={containerRef} className="flex flex-row space-x-4 relative">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        ref={(element) => { if (element) buttonRefs.current.set(tab.id, element); }}
                        className="text-2xl font-bold cursor-pointer pb-1 text-white"
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (withRoutes) {
                                const route = baseRoute
                                    ? `${baseRoute.replace(/\/$/, "")}/${tab.id}`
                                    : `${pathname.replace(/\/$/, "")}/${tab.id}`;
                                router.push(route);
                            }
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
                <div
                    className="absolute bottom-0 border-b-2 border-sky-400 transition-all duration-300 ease-in-out"
                    style={{
                        width: underlineStyle.width,
                        left: underlineStyle.left,
                        transition: hasMeasured.current ? "all 300ms ease-in-out" : "none"
                    }}
                />
            </div>
            <div className="mt-4">
                {tabs.find(tab => tab.id === activeTab)?.content}
            </div>
        </>
    );
}
