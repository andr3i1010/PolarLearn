"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface CreatorLinkClientProps {
    displayName: string;
    jdenticonValue: string;
    color?: string;
    setJdenticonValue?: (value: string) => void;
    userId?: string; // Add userId for UUID-based navigation
}

export default function CreatorLinkClient({
    displayName,
    jdenticonValue,
    color,
    setJdenticonValue,
    userId
}: CreatorLinkClientProps) {
    const router = useRouter();

    useEffect(() => {
        // Update the Jdenticon value if the callback is provided
        if (setJdenticonValue) {
            setJdenticonValue(jdenticonValue);
        }
    }, [jdenticonValue, setJdenticonValue]);

    const handleCreatorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Use userId for navigation if available, otherwise fall back to displayName
        const navigationTarget = userId ? userId : displayName;
        router.push(`/home/viewuser/${navigationTarget}`);
    };

    return (
        <span
            className={`${color === 'white' ? 'text-white hover:text-blue-400 transition' : 'text-blue-400'} hover:underline cursor-pointer`}
            onClick={handleCreatorClick}
        >
            {displayName}
        </span>
    );
}
