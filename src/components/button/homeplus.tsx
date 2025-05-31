"use client";

import { LetterText, List } from "lucide-react";
import { motion } from "motion/react"; // Assuming this is Framer Motion or compatible
import Link from "next/link";
import { useState, useEffect } from "react";

// Assuming Shadcn UI dialog components are available via this path
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Simple media query hook (can be replaced with your existing src/hooks/use-mobile.ts if preferred)
const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            setMatches(false); // Default for SSR or environments without window
            return;
        }
        const mediaQueryList = window.matchMedia(query);
        const listener = () => setMatches(mediaQueryList.matches);
        listener(); // Set initial state
        mediaQueryList.addEventListener('change', listener);
        return () => mediaQueryList.removeEventListener('change', listener);
    }, [query]);

    return matches;
};


export default function HomePlusBtn() {
    const [open, setOpen] = useState(false); // For desktop expand
    const [showDialog, setShowDialog] = useState(false); // For mobile dialog
    const isMobile = useMediaQuery('(max-width: 768px)'); // md breakpoint

    const handleDesktopClick = () => {
        setOpen(!open);
    };

    const buttonWidthClass = isMobile ? "w-[40px]" : (open ? "w-[400px]" : "w-[40px]");

    const PlusIcon = () => (
        <svg
            width="40px"
            height="40px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0" // Prevent icon from shrinking
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
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                ></path>
            </g>
        </svg>
    );

    const LinksContent = ({ isMobileLayout }: { isMobileLayout: boolean }) => (
        <div className={`flex items-center ${isMobileLayout ? 'flex-col gap-y-3 w-full py-4' : 'flex-row gap-x-2 pl-1'}`}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: isMobileLayout ? 0.1 : 0.2 }}
                className={isMobileLayout ? 'w-full' : ''}
            >
                <Link
                    className={`rounded-full hover:bg-neutral-600 flex flex-row items-center transition-all font-bold px-3 py-2 gap-x-2 ${isMobileLayout ? 'w-full max-w-xs mx-auto justify-center text-base' : 'h-min min-w-min text-sm'}`}
                    href="/learn/createlist"
                    onClick={() => { if (isMobileLayout) setShowDialog(false); }}
                >
                    <List />
                    Nieuwe lijst
                </Link>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: isMobileLayout ? 0.15 : 0.3 }}
                className={isMobileLayout ? 'w-full' : ''}
            >
                <Link
                    className={`rounded-full hover:bg-neutral-600 flex flex-row items-center transition-all font-bold px-3 py-2 gap-x-2 ${isMobileLayout ? 'w-full max-w-xs mx-auto justify-center text-base' : 'h-min min-w-min text-sm'}`}
                    href="/learn/createsummary"
                    onClick={() => { if (isMobileLayout) setShowDialog(false); }}
                >
                    <LetterText/>
                    Nieuwe samenvatting
                </Link>
            </motion.div>
        </div>
    );

    if (isMobile) {
        return (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="bg-neutral-800 dark:bg-neutral-900 h-[40px] w-[40px] rounded-full flex items-center justify-center hover:bg-neutral-700 dark:hover:bg-neutral-800 transition-colors ease-in-out hover:cursor-pointer"
                        aria-label="Open creation menu"
                    >
                        <PlusIcon />
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-neutral-800 border-neutral-700">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-100">Maak nieuw</DialogTitle>
                    </DialogHeader>
                    <LinksContent isMobileLayout={true} />
                </DialogContent>
            </Dialog>
        );
    }

    // Desktop version
    return (
        <button
            type="button"
            className={`bg-neutral-800 dark:bg-neutral-900 h-[40px] rounded-full flex items-center hover:bg-neutral-700 dark:hover:bg-neutral-800 transition-all ease-in-out hover:cursor-pointer ${buttonWidthClass} duration-300`}
            onClick={handleDesktopClick}
            data-open={open}
        >
            <div className="p-0 m-0 flex-shrink-0"><PlusIcon /></div>
            {open && <LinksContent isMobileLayout={false} />}
        </button>
    );
}