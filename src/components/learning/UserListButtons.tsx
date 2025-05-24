"use client";

import { useEffect, useState } from "react";
import { PencilIcon } from "lucide-react";
import Link from "next/link";
import DeleteListButton from "./DeleteListButton";

interface UserListButtonsProps {
    listId: string;
    creatorId: string;
}

export default function UserListButtons({ listId, creatorId }: UserListButtonsProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Fetch current user ID from client-side for comparison
    useEffect(() => {
        async function fetchUserInfo() {
            try {
                // Use fetch instead of direct import to avoid SSR issues
                const response = await fetch('/api/auth/user');
                const data = await response.json();

                if (data && data.id) {
                    setUserId(data.id);

                    // Show buttons if user is creator
                    if (data.id === creatorId || data.name === creatorId || data.role === 'admin') {
                        console.log('Showing buttons - User matches creator or is admin', data.id, creatorId);
                        setIsVisible(true);
                    } else {
                        console.log('Not showing buttons - User is not creator', data.id, creatorId);
                    }
                }
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        }

        fetchUserInfo();
    }, [creatorId]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="flex items-center gap-3">
            {/* Edit button */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                <Link
                    href={`/learn/editlist/${listId}`}
                    className="flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                    title="Lijst bewerken"
                >
                    <PencilIcon className="h-6 w-6 text-white" />
                </Link>
            </div>

            {/* Delete button */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                <DeleteListButton listId={listId} isCreator={true} />
            </div>
        </div>
    );
}
