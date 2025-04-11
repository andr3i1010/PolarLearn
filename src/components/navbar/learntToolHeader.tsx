"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { X, ArrowLeft, Check, X as XIcon } from "lucide-react";
import Link from "next/link";
import Dropdown from "@/components/button/DropdownBtn";
import Image from "next/image";

// Import the images for the learning methods
import learn from "@/app/img/learn.svg";
import test from "@/app/img/test.svg";
import hints from "@/app/img/hint.svg";
import mind from "@/app/img/mind.svg";
import livequiz from "@/app/img/livequiz.svg";

interface LearnToolHeaderProps {
    listId: string;
    progress?: number; // 0-100
    correctAnswers?: number;
    wrongAnswers?: number;
    onMethodChange?: (method: string) => void;
    currentMethod?: string;
}

const LearnToolHeader = ({
    listId,
    progress = 0,
    correctAnswers = 0,
    wrongAnswers = 0,
    onMethodChange,
    currentMethod = "leren",
}: LearnToolHeaderProps) => {
    const router = useRouter();
    const [seconds, setSeconds] = useState(0);

    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format the time as MM:SS
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    };

    // Define the learning methods for the dropdown
    const learningMethods: [React.ReactNode, string][] = [
        [
            <div key="leren" className="flex items-center">
                <Image
                    src={learn}
                    alt="leren plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Leren</span>
            </div>,
            `/learn/learnlist/${listId}`,
        ],
        [
            <div key="toets" className="flex items-center">
                <Image
                    src={test}
                    alt="toets plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Toets</span>
            </div>,
            `/learn/test/${listId}`,
        ],
        [
            <div key="hints" className="flex items-center">
                <Image
                    src={hints}
                    alt="hints plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Hints</span>
            </div>,
            `/learn/hints/${listId}`,
        ],
        [
            <div key="gedachten" className="flex items-center">
                <Image
                    src={mind}
                    alt="mind plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">In gedachten</span>
            </div>,
            `/learn/mind/${listId}`,
        ],
        [
            <div key="multikeuze" className="flex items-center">
                <Image
                    src={livequiz}
                    alt="Multikeuze plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Multikeuze</span>
            </div>,
            `/learn/multichoice/${listId}`,
        ],
    ];

    // Get the current method display name
    const getMethodDisplayText = () => {
        switch (currentMethod) {
            case "toets":
                return "Toets";
            case "hints":
                return "Hints";
            case "gedachten":
                return "In gedachten";
            case "multikeuze":
                return "Multikeuze";
            default:
                return "Leren";
        }
    };

    return (
        <>
            <div className="w-full bg-neutral-800 p-3 flex items-center justify-between sticky top-0 z-10 border-b border-neutral-700">
                {/* Left side: Method dropdown and back button */}
                <div className="flex items-center gap-3">
                    <div className="relative learn-dropdown">
                        <Dropdown
                            text={getMethodDisplayText()}
                            dropdownMatrix={learningMethods}
                            width={180}
                        />
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="flex items-center bg-neutral-700 hover:bg-neutral-600 transition-colors px-3 py-1 rounded-md"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span>Terug</span>
                    </button>

                    <div className="text-white font-mono bg-neutral-700 px-3 py-1 rounded-md">
                        {formatTime(seconds)}
                    </div>
                </div>

                {/* Middle: Progress bar */}
                <div className="flex-grow mx-4 max-w-md">
                    <Progress value={progress} className="h-3 [&>div]:bg-sky-400" />
                </div>

                {/* Right side: Score and close button */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center text-green-500 bg-green-900/30 px-2 py-1 rounded-md">
                            <Check className="h-5 w-5 mr-1" />
                            {correctAnswers}
                        </span>
                        <span className="flex items-center text-red-500 bg-red-900/30 px-2 py-1 rounded-md">
                            <XIcon className="h-5 w-5 mr-1" />
                            {wrongAnswers}
                        </span>
                    </div>

                    <Link
                        href="/home/start"
                        className="flex items-center justify-center h-8 w-8 bg-neutral-700 hover:bg-neutral-600 transition-colors rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </Link>
                </div>
            </div>

            <style jsx global>{`
        .learn-dropdown > div.absolute {
          left: 200px !important;
          top: -24px !important;
          z-index: 100;
        }
      `}</style>
        </>
    );
};

export default LearnToolHeader;
