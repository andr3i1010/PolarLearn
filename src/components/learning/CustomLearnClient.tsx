"use client";

import { useEffect, useState } from 'react';
import LearnToolWithProgress from "@/components/learning/LearnToolWithProgress";

interface CustomLearnClientProps {
    mode: "toets" | "gedachten" | "hints" | "learn" | "multikeuze" | "leren";
    rawlistdata: any[];
    listId: string;
    currentMethod: string;
    isCombinedList?: boolean;
}

export default function CustomLearnClient({
    mode,
    rawlistdata,
    listId,
    currentMethod,
    isCombinedList = false
}: CustomLearnClientProps) {
    const [actualRawData, setActualRawData] = useState(rawlistdata);

    useEffect(() => {
        // If this is a combined list, get the data from sessionStorage
        if (isCombinedList && typeof window !== 'undefined') {
            const combinedDataStr = sessionStorage.getItem('combinedListData');
            if (combinedDataStr) {
                try {
                    const combinedData = JSON.parse(combinedDataStr);
                    if (combinedData && combinedData.data) {
                        // Transform to the format expected by LearnToolWithProgress
                        const transformedData = combinedData.data.map((item: any) => ({
                            vraag: item["1"] || "",
                            antwoord: item["2"] || ""
                        }));
                        setActualRawData(transformedData);
                    }
                } catch (error) {
                    console.error('Error parsing combined list data:', error);
                }
            }
        }
    }, [isCombinedList]);

    const clearCustomCookies = () => {
        // Clear the temporary cookies when learning session is complete
        document.cookie = 'selectedPairs=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = 'fromLanguage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = 'toLanguage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = 'listId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

        // Also clear sessionStorage for combined lists
        if (isCombinedList) {
            sessionStorage.removeItem('combinedListData');
        }
    };

    // Also clear cookies if component unmounts (user navigates away)
    useEffect(() => {
        return () => {
            // Only clear if we detect this is a custom learning session
            if (listId.startsWith('custom-')) {
                clearCustomCookies();
            }
        };
    }, [listId, isCombinedList]);

    return (
        <LearnToolWithProgress
            mode={mode}
            rawlistdata={actualRawData}
            listId={listId}
            currentMethod={currentMethod}
            onComplete={clearCustomCookies}
        />
    );
}
