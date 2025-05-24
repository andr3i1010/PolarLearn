"use client";

import { PencilIcon } from "lucide-react";
import Link from "next/link";
import DeleteListButton from "./DeleteListButton";

interface ListActionButtonsProps {
    listId: string;
    isCreator: boolean;
}

export default function ListActionButtons({ listId, isCreator }: ListActionButtonsProps) {
    if (!isCreator) {
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
