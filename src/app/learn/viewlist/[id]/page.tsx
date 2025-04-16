import { prisma } from "@/utils/prisma"
import { NextPage } from 'next';
import Link from "next/link";
import Tabs, { TabItem } from "@/components/Tabs";
import Dropdown from "@/components/button/DropdownBtn";
import React from 'react';
import { PencilIcon, Trash2 } from "lucide-react";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth/auth";
import { Badge } from "@/components/ui/badge";
import DeleteListButton from "@/components/learning/DeleteListButton";

import Image from "next/image";
import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/english.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';
import gs_img from '@/app/img/history.svg';
import bi_img from '@/app/img/bio.svg';

import learn from '@/app/img/learn.svg';
import test from '@/app/img/test.svg';
import hints from '@/app/img/hint.svg';
import mind from '@/app/img/mind.svg';
import livequiz from '@/app/img/livequiz.svg';

import construction from '@/app/img/construction.gif';

// Component to display the appropriate subject icon

// Alternative implementation using the custom SVG images
// Uncomment and use this if you prefer the custom SVG images

const SubjectIconWithSVG = ({ subject }: { subject: string }) => {
    const iconClass = "h-8 w-8 inline-block mr-2";

    switch (subject?.toUpperCase()) {
        case 'WI':  // Wiskunde
            return <Image src={math_img} alt="Wiskunde" width={30} height={30} className={iconClass} />;
        case 'NSK': // NaSk
            return <Image src={nsk_img} alt="NaSk" width={30} height={30} className={iconClass} />;
        case 'AK':  // Aardrijkskunde
            return <Image src={ak_img} alt="Aardrijkskunde" width={30} height={30} className={iconClass} />;
        case 'FR':  // Frans
            return <Image src={fr_img} alt="Frans" width={30} height={30} className={iconClass} />;
        case 'EN':  // Engels
            return <Image src={eng_img} alt="Engels" width={30} height={30} className={iconClass} />;
        case 'DE':  // Duits
            return <Image src={de_img} alt="Duits" width={30} height={30} className={iconClass} />;
        case 'NL':  // Nederlands
            return <Image src={nl_img} alt="Nederlands" width={30} height={30} className={iconClass} />;
        case 'GS':  // Geschiedenis
            return <Image src={gs_img} alt="Geschiedenis" width={30} height={30} className={iconClass} />;
        case 'BI':  // Biologie
            return <Image src={bi_img} alt="Biologie" width={30} height={30} className={iconClass} />;
        default: return null;
    }
};

interface PageParams {
    params: {
        id: string;
    };
    searchParams?: Record<string, string | string[] | undefined>;
}

// Interface for word pair structure
interface WordPair {
    "1": string;  // term
    "2": string;  // definition
    id: number;
}

// Helper function to validate if an object is a WordPair
function isWordPair(obj: any): obj is WordPair {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        typeof obj["1"] === 'string' &&
        typeof obj["2"] === 'string' &&
        typeof obj.id === 'number'
    );
}

// Helper function to check if array contains WordPair objects
function isWordPairArray(arr: any[]): arr is WordPair[] {
    return arr.every(item => isWordPair(item));
}

const ViewListPage: NextPage<any, PageParams> = async ({ params }: PageParams) => {
    // Capture id once to use on multiple locations.
    const { id } = await params;
    const listData = await prisma.practice.findFirst({
        where: {
            list_id: id
        },
        select: {
            list_id: true,
            name: true,
            createdAt: true,
            creator: true,
            data: true,
            subject: true,
            lang_from: true,
            lang_to: true,
            published: true,
            updatedAt: true
        }
    });

    // Check if current user is the creator to show edit button
    const currentUser = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);
    const isCreator = listData?.creator === currentUser?.name || currentUser?.role === "admin";
    const isUnpublished = listData?.published === false;

    // Use the top-level subject field from the practice model
    const subject = listData?.subject || 'general';

    // Check if the subject is a language
    const isLanguageSubject = ['NL', 'EN', 'FR', 'DE'].includes(subject.toUpperCase());

    // Get language names for display
    const getLanguageName = (code: string) => {
        switch (code?.toUpperCase()) {
            case 'NL': return 'Nederlands';
            case 'EN': return 'Engels';
            case 'FR': return 'Frans';
            case 'DE': return 'Duits';
            default: return code;
        }
    };

    // Get language icon based on language code
    const getLanguageIcon = (code: string) => {
        switch (code?.toUpperCase()) {
            case 'NL': return nl_img;
            case 'EN': return eng_img;
            case 'FR': return fr_img;
            case 'DE': return de_img;
            default: return null;
        }
    };

    // From and To language info
    const fromLanguage = listData?.lang_from ? getLanguageName(listData.lang_from) : '';
    const toLanguage = listData?.lang_to ? getLanguageName(listData.lang_to) : '';

    // Get language icons
    const fromLanguageIcon = listData?.lang_from ? getLanguageIcon(listData.lang_from) : null;
    const toLanguageIcon = listData?.lang_to ? getLanguageIcon(listData.lang_to) : null;

    // Handle the word pairs data - could be already an object or a JSON string
    let wordPairs: WordPair[] = [];
    if (listData?.data) {
        try {
            let parsedData: any;

            // Check if data is already an object or needs parsing
            if (typeof listData.data === 'string') {
                parsedData = JSON.parse(listData.data);
            } else {
                parsedData = listData.data;
            }

            // Verify the data is an array
            if (Array.isArray(parsedData)) {
                // Type check the array elements
                if (isWordPairArray(parsedData)) {
                    wordPairs = parsedData;
                } else {
                    console.error("Data contains elements that don't match WordPair structure");
                    // Try to salvage valid entries if possible
                    wordPairs = parsedData.filter(isWordPair);
                }
            } else {
                console.error("Data is not an array:", parsedData);
            }
        } catch (error) {
            console.error("Error processing data:", error, "Raw data:", listData.data);
        }
    }

    // Define practice options for the dropdown with styled elements
    const practiceOptions: [React.ReactNode, string][] = [
        [
            <div key="leren" className="flex items-center">
                <Image src={learn} alt="leren plaatje" width={20} height={20} className="mr-2" />
                <span className="font-medium">Leren</span>
            </div>,
            `/learn/learnlist/${id}`
        ],
        [
            <div key="toets" className="flex items-center">
                <Image src={test} alt="toets plaatje" width={20} height={20} className="mr-2" />
                <span className="font-medium">Toets</span>
            </div>,
            `/learn/test/${id}`
        ],
        [
            <div key="hints" className="flex items-center">
                <Image src={hints} alt="hints plaatje" width={20} height={20} className="mr-2" />
                <span className="font-medium">Hints</span>
            </div>,
            `/learn/hints/${id}`
        ],
        [
            <div key="mind" className="flex items-center">
                <Image src={mind} alt="mind plaatje" width={20} height={20} className="mr-2" />
                <span className="font-medium">In gedachten</span>
            </div>,
            `/learn/mind/${id}`
        ],
        [
            <div key="multichoice" className="flex items-center">
                <Image src={livequiz} alt="Multikeuze plaatje" width={20} height={20} className="mr-2" />
                <span className="font-medium">Multikeuze</span>
            </div>,
            `/learn/multichoice/${id}`
        ],
        [
            <div key="livequiz" className="flex items-center">
                <Image src={livequiz} alt="livequiz plaatje" width={20} height={20} className="mr-2" />
                <span className="font-medium">LiveQuiz</span>
            </div>,
            `/learn/livequiz/${id}`
        ]
    ];

    // Define tabs for this page
    const tabs: TabItem[] = [
        {
            id: 'woorden',
            label: 'Woorden',
            content: (
                <div className="mt-4">
                    {wordPairs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700 rounded-lg overflow-hidden">
                                {/* Language header as part of the table */}
                                {fromLanguage && toLanguage && (
                                    <thead className="bg-neutral-800 border-b border-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 w-1/2">
                                                <div className="flex items-center justify-center">
                                                    {fromLanguageIcon && (
                                                        <Image
                                                            src={fromLanguageIcon}
                                                            alt={`${fromLanguage} icoon`}
                                                            width={24}
                                                            height={24}
                                                            className="mr-2"
                                                        />
                                                    )}
                                                    <span className="text-white text-xl font-bold">{fromLanguage}</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 w-1/2">
                                                <div className="flex items-center justify-center">
                                                    {toLanguageIcon && (
                                                        <Image
                                                            src={toLanguageIcon}
                                                            alt={`${toLanguage} icon`}
                                                            width={24}
                                                            height={24}
                                                            className="mr-2"
                                                        />
                                                    )}
                                                    <span className="text-white text-xl font-bold">{toLanguage}</span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                )}
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-center text-xl font-medium text-gray-300 w-1/2">
                                            {isLanguageSubject ? 'Origineel' : 'Term'}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xl font-medium text-gray-300 w-1/2">
                                            {isLanguageSubject ? 'Vertaling' : 'Definitie'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-800">
                                    {wordPairs
                                        .filter(pair =>
                                            pair["1"] !== "" || pair["2"] !== "" // Only filter out completely empty pairs
                                        )
                                        .map((pair) => {
                                            return (
                                                <tr key={pair.id} className={pair.id % 2 === 0 ? 'bg-neutral-800' : 'bg-neutral-800'}>
                                                    <td className="px-6 py-4 text-center font-bold text-xl text-white">{pair["1"]}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-xl text-white">{pair["2"]}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center">
                            Geen woorden gevonden in deze lijst.
                        </p>
                    )}
                </div>
            )
        },
        {
            id: 'resultaten',
            label: 'Resultaten',
            content: (
                <div>
                    {/* Resultaten content will go here */}
                    <Image src={construction} alt="under construction!" width={500} height={100} />
                </div>
            )
        }
    ];

    return (
        <div className="px-4">
            <div className="h-4" />
            <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold flex items-center gap-2">
                        <SubjectIconWithSVG subject={subject} />
                        <span className="whitespace-normal break-words max-w-[40ch]">{listData?.name}</span>
                        {isUnpublished && (
                            <Badge
                                variant="secondary"
                                className="ml-2 bg-amber-600/20 text-amber-500 border border-amber-600/50"
                            >
                                Concept
                            </Badge>
                        )}
                    </h1>

                    {/* Creator actions */}
                    {isCreator && (
                        <div className="flex items-center gap-3">
                            {/* Edit button */}
                            <Link
                                href={`/learn/editlist/${id}`}
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                                title="Lijst bewerken"
                            >
                                <PencilIcon className="h-6 w-6 text-white" />
                            </Link>

                            {/* Delete button */}
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                <DeleteListButton listId={id} isCreator={isCreator} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="h-4" />
                <div className="flex flex-col gap-4">
                    <div className="flex-row flex items-center">
                        <p>Gemaakt door:</p>
                        <div className="w-2" />
                        <Link className="text-sky-400" href={`/home/viewuser/${listData?.creator}`}>{listData?.creator}</Link>
                    </div>

                    <div className="relative h-12">
                        <Dropdown
                            text="Oefenen"
                            dropdownMatrix={practiceOptions}
                            width={180}
                        />
                    </div>
                </div>
            </div>
            <br />
            <div className="pl-4">
                <Tabs tabs={tabs} defaultActiveTab="woorden" />
            </div>
            <div className="h-4" />
        </div>
    )
}

export default ViewListPage;