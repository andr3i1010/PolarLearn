"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface CreatorLinkClientProps {
    displayName: string;
    jdenticonValue: string;
    color?: string;
    setJdenticonValue?: (value: string) => void;
}

export default function CreatorLinkClient({
    displayName,
    jdenticonValue,
    color,
    setJdenticonValue
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
        router.push(`/home/viewuser/${displayName}`);
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
