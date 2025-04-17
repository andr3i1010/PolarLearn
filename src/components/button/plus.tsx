"use client";
import Link from "next/link";
import { useTransition } from "react";

type ActionFunction = (() => void) | (() => Promise<any>);

export default function PlusBtn({
    redir,
    action
}: {
    redir?: string,
    action?: ActionFunction
}) {
    const [isPending, startTransition] = useTransition();

    if (redir) {
        return (
            <Link href={redir}>
                <div className="bg-neutral-700 w-min h-min rounded-full flex justify-center hover:bg-neutral-600 transition-all">
                    <svg
                        width="40px"
                        height="40px"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ margin: "auto", display: "block" }}
                    >
                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                        <g
                            id="SVGRepo_tracerCarrier"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></g>
                        <g id="SVGRepo_iconCarrier">
                            <path
                                d="M6 12H18M12 6V18"
                                stroke="#000000"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            ></path>
                        </g>
                    </svg>
                </div>
            </Link>
        );
    }

    // If action is provided, wrap it in a React useTransition to handle server actions
    const handleClick = () => {
        if (action) {
            startTransition(() => {
                try {
                    action();
                } catch (error) {
                    console.error("Error executing action:", error);
                }
            });
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            className={`bg-neutral-700 w-min h-min rounded-full flex justify-center hover:bg-neutral-600 transition-all ${isPending ? 'opacity-50' : ''}`}
            style={{ padding: 0, border: "none", background: "none" }}
        >
            <svg
                width="40px"
                height="40px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ margin: "auto", display: "block" }}
            >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                    <path
                        d="M6 12H18M12 6V18"
                        stroke="#000000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    ></path>
                </g>
            </svg>
        </button>
    );
}