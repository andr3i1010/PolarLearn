"use client";

import { useEffect, useState } from "react";
import { getUserIdByName } from "@/serverActions/getUserName";
import Link from "next/link";

interface ClientCreatorLinkProps {
    creator: string;
    user?: {
        name?: string | null;
        image?: string | null;
    } | null;
}

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ClientCreatorLink({ creator }: ClientCreatorLinkProps) {
    const [navigationTarget, setNavigationTarget] = useState<string>(creator);

    useEffect(() => {
        // If creator is already a UUID, use it directly
        if (UUID_REGEX.test(creator)) {
            setNavigationTarget(creator);
        } else {
            // If creator is a name, fetch the UUID
            const fetchUserId = async () => {
                try {
                    const userInfo = await getUserIdByName(creator);
                    if (userInfo.id) {
                        setNavigationTarget(userInfo.id);
                    }
                } catch (err) {
                    console.error("Error fetching user ID:", err);
                }
            };
            fetchUserId();
        }
    }, [creator]);

    return (
        <Link
            href={`/home/viewuser/${navigationTarget}`}
            className="text-blue-400 hover:underline transition-colors cursor-pointer"
        >
            {creator}
        </Link>
    );
}
