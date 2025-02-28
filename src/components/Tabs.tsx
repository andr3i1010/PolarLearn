"use client"

import { useState, useRef, useLayoutEffect, ReactNode } from "react";

// Interface for tab configuration
export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface UserTabsProps {
  tabs: TabItem[];
  defaultActiveTab?: string;
}

export default function Tabs({ tabs, defaultActiveTab }: UserTabsProps) {
    const [activeTab, setActiveTab] = useState<string>(defaultActiveTab || (tabs.length > 0 ? tabs[0].id : ''));
    const [underlineStyle, setUnderlineStyle] = useState({
        width: 0,
        left: 0
    });
    
    // Use a single ref for the container and track button elements by id
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    
    // Update underline position based on active tab
    useLayoutEffect(() => {
        const activeButton = buttonRefs.current.get(activeTab);
        
        if (activeButton && containerRef.current) {
            // Calculate position relative to the container
            const containerLeft = containerRef.current.getBoundingClientRect().left;
            const buttonRect = activeButton.getBoundingClientRect();
            
            setUnderlineStyle({
                width: buttonRect.width,
                left: buttonRect.left - containerLeft
            });
        }
    }, [activeTab]);
    
    // Update underline on window resize
    useLayoutEffect(() => {
        const handleResize = () => {
            const activeButton = buttonRefs.current.get(activeTab);
            
            if (activeButton && containerRef.current) {
                const containerLeft = containerRef.current.getBoundingClientRect().left;
                const buttonRect = activeButton.getBoundingClientRect();
                
                setUnderlineStyle({
                    width: buttonRect.width,
                    left: buttonRect.left - containerLeft
                });
            }
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
                        ref={(element) => {
                            if (element) {
                                buttonRefs.current.set(tab.id, element);
                            }
                        }}
                        className={`text-2xl font-bold cursor-pointer pb-1 text-white`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
                
                {/* Animated underline */}
                <div 
                    className="absolute bottom-0 border-b-2 border-sky-400 transition-all duration-300 ease-in-out"
                    style={{
                        width: underlineStyle.width,
                        left: underlineStyle.left
                    }}
                />
            </div>
            <div className="mt-4">
                {tabs.find(tab => tab.id === activeTab)?.content}
            </div>
        </>
    );
}
