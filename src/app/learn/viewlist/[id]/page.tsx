import { prisma } from "@/utils/prisma"
import { NextPage } from 'next';
import Tabs, { TabItem } from "@/components/Tabs";
import Dropdown from "@/components/button/DropdownBtn";
import React from 'react';
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth/auth";
import { Badge } from "@/components/ui/badge";
import UserListButtons from "@/components/learning/UserListButtons";
import CreatorLink from "@/components/links/CreatorLink";
import { addToRecentLists } from "@/utils/actions/updateRecentLists";
import { addToRecentSubjects } from "@/utils/actions/updateRecentSubjects";
import { Metadata } from "next";

import Image from "next/image";
import { getSubjectIcon, getSubjectName } from "@/components/icons";
import learn from '@/app/img/learn.svg';
import test from '@/app/img/test.svg';
import hints from '@/app/img/hint.svg';
import mind from '@/app/img/mind.svg';
import livequiz from '@/app/img/livequiz.svg';

import construction from '@/app/img/construction.gif';
import ListTableComponent from "./listTableComponent";

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

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;

    try {
        const listData = await prisma.practice.findFirst({
            where: {
                list_id: id
            },
            select: {
                name: true,
                subject: true,
                lang_from: true,
                lang_to: true,
                data: true,
                creator: true
            }
        });

        if (!listData) {
            return {
                title: "Lijst niet gevonden | PolarLearn",
                description: "De gevraagde woordenlijst kon niet worden gevonden.",
            };
        }

        // Get subject name for better display
        const subjectName = listData.subject ? getSubjectName(listData.subject) : '';

        // Count words in the list
        let wordCount = 0;
        if (listData.data) {
            try {
                let parsedData: any;
                if (typeof listData.data === 'string') {
                    parsedData = JSON.parse(listData.data);
                } else {
                    parsedData = listData.data;
                }
                if (Array.isArray(parsedData)) {
                    wordCount = parsedData.length;
                }
            } catch (error) {
                // If parsing fails, default to 0
                wordCount = 0;
            }
        }

        // Create a descriptive title
        let title = listData.name;
        if (subjectName) {
            title += ` | ${subjectName}`;
        }
        title += " | PolarLearn";

        // Create description with word count and subject info
        let description = `Oefen met deze woordenlijst "${listData.name}"`;
        if (wordCount > 0) {
            description += ` met ${wordCount} ${wordCount === 1 ? 'woord' : 'woorden'}`;
        }
        if (listData.lang_from && listData.lang_to) {
            const fromLang = getSubjectName(listData.lang_from);
            const toLang = getSubjectName(listData.lang_to);
            if (fromLang && toLang) {
                description += ` (${fromLang} → ${toLang})`;
            }
        }
        description += " op PolarLearn";

        return {
            title,
            description: description.substring(0, 160), // Limit for SEO
        };
    } catch (error) {
        return {
            title: "PolarLearn Woordenlijsten",
            description: "Oefen met woordenlijsten en verbeter je kennis op PolarLearn",
        };
    }
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

    // Add this list to user's recent lists
    if (listData) {
        await addToRecentLists(id);

        // Also add the subject to recent subjects if available
        if (listData.subject) {
            await addToRecentSubjects(listData.subject);
        }
    }

    // Check if current user is the creator to show edit button
    const currentUser = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);
    // Check both name and id to ensure we match the creator correctly
    const isCreator = (listData?.creator === currentUser?.name ||
        listData?.creator === currentUser?.id ||
        currentUser?.role === "admin");
    const isUnpublished = listData?.published === false;

    // Use the top-level subject field from the practice model
    const subject = listData?.subject || 'general';

    // Check if the subject is a language
    const isLanguageSubject = ['NL', 'EN', 'FR', 'DE'].includes(subject.toUpperCase());

    // From and To language info
    const fromLanguage = listData?.lang_from ? getSubjectName(listData.lang_from) : '';
    const toLanguage = listData?.lang_to ? getSubjectName(listData.lang_to) : '';

    // Get language icons
    const fromLanguageIcon = listData?.lang_from ? getSubjectIcon(listData.lang_from) : null;
    const toLanguageIcon = listData?.lang_to ? getSubjectIcon(listData.lang_to) : null;

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
                    wordPairs = parsedData.filter(isWordPair);
                }
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
                            <ListTableComponent
                                wordPairs={wordPairs}
                                edit={false}
                                fromLanguage={fromLanguage}
                                toLanguage={toLanguage}
                                fromLanguageIcon={fromLanguageIcon}
                                toLanguageIcon={toLanguageIcon}
                                isLanguageSubject={isLanguageSubject}
                                listId={id}
                            />
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
                        <Image src={getSubjectIcon(subject)} alt="vak icon" width={30} height={30} className={"h-8 w-8 inline-block mr-2"} />
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

                    {/* Creator actions - pass isCreator boolean from server-side permission check */}
                    <UserListButtons listId={id} isCreator={isCreator} />
                </div>
                <div className="h-4" />
                <div className="flex flex-col gap-4">
                    <div className="flex-row flex items-center">
                        <p>Gemaakt door:</p>
                        <div className="w-2" />
                        <CreatorLink creator={listData?.creator || ""} />
                    </div>

                    <div className="relative h-12">
                        <Dropdown
                            text="Oefenen"
                            dropdownMatrix={practiceOptions}
                            width={180}
                            zIndex={10}
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