"use client";
import { usePathname } from 'next/navigation';
import SessionProvider from "@/components/sessionProvider";
import React from 'react';

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Only apply SessionProvider if not on the root path
    if (pathname === '/' || pathname.startsWith('/auth')) {
        return <>{children}</>;
    }

    return (
        <SessionProvider checkInterval={5 * 60 * 1000}>
            {children}
        </SessionProvider>
    );
}
