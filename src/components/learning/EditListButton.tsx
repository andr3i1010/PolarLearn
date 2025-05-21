"use client";

import { PencilIcon } from "lucide-react";
import Link from "next/link";

interface EditListButtonProps {
    listId: string;
    isCreator: boolean;
}

export default function EditListButton({
    listId,
    isCreator,
}: EditListButtonProps) {
    // Don't render anything if user is not the creator
    if (!isCreator) {
        return null;
    }

    return (
        <Link
            href={`/learn/editlist/${listId}`}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
            title="Lijst bewerken"
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <PencilIcon className="h-6 w-6 text-white" />
        </Link>
    );
}
