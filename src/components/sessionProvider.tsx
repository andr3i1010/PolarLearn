"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface SessionContextType {
    isAuthenticated: boolean;
    loading: boolean;
    refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
    isAuthenticated: false,
    loading: true,
    refreshSession: async () => { }
});

export const useSession = () => useContext(SessionContext);

export default function SessionProvider({
    children,
    checkInterval = 30000 // 30 seconds
}: {
    children: ReactNode;
    checkInterval?: number;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const checkSession = async () => {
        try {
            const response = await fetch("/api/auth/check-session");

            if (response.status === 401) {
                setIsAuthenticated(false);
                router.push("/auth/sign-in");
                return false;
            }

            setIsAuthenticated(true);
            return true;
        } catch (error) {
            setIsAuthenticated(false);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const refreshSession = async () => {
        setLoading(true);
        await checkSession();
    };

    useEffect(() => {
        // Initial session check
        checkSession();

        // Set up periodic session checks
        const intervalId = setInterval(checkSession, checkInterval);

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
    }, [checkInterval]);

    return (
        <SessionContext.Provider value={{ isAuthenticated, loading, refreshSession }}>
            {children}
        </SessionContext.Provider>
    );
}
