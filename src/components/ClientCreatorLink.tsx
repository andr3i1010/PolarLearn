"use client";

import Link from "next/link";

interface ClientCreatorLinkProps {
    creator: string;
    user?: {
        name?: string | null;
        image?: string | null;
    } | null;
}

export default function ClientCreatorLink({ creator }: ClientCreatorLinkProps) {
    return (
        <Link
            href={`/home/viewuser/${creator}`}
            className="hover:text-blue-400 text-white hover:underline transition-colors"
        >
            {creator}
        </Link>
    );
}
