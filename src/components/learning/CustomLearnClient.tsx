"use client";

import { useEffect } from 'react';
import LearnToolWithProgress from "@/components/learning/LearnToolWithProgress";

interface CustomLearnClientProps {
    mode: "toets" | "gedachten" | "hints" | "learn" | "multikeuze" | "leren";
    rawlistdata: any[];
    listId: string;
    currentMethod: string;
}

export default function CustomLearnClient({
    mode,
    rawlistdata,
    listId,
    currentMethod
}: CustomLearnClientProps) {
    const clearCustomCookies = () => {
        // Clear the temporary cookies when learning session is complete
        document.cookie = 'selectedPairs=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = 'fromLanguage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = 'toLanguage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = 'listId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    };

    // Also clear cookies if component unmounts (user navigates away)
    useEffect(() => {
        return () => {
            // Only clear if we detect this is a custom learning session
            if (listId.startsWith('custom-')) {
                clearCustomCookies();
            }
        };
    }, [listId]);

    return (
        <LearnToolWithProgress
            mode={mode}
            rawlistdata={rawlistdata}
            listId={listId}
            currentMethod={currentMethod}
            onComplete={clearCustomCookies}
        />
    );
}
