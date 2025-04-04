import { prisma } from "@/utils/prisma";
import * as jdenticon from "jdenticon";
import Tabs, { TabItem } from "@/components/Tabs";
import Image from "next/image";
import Link from "next/link";
import Button1 from "@/components/button/Button1";

import construction from '@/app/img/construction.gif'

// Import subject icons
import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/english.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

// Add an interface for list data structure
interface ListData {
    created_lists?: string[] | null;
    // Add other properties as needed
}

// Add interface for type checking the list returned from prisma
interface PracticeList {
    list_id: string;
    name: string;
    subject: string;
    createdAt: Date;
}

interface PageProps {
    params: Promise<{
        name: string;
        selectedTab?: string;
    }>;
}

// Function to get the appropriate icon for each subject
const getSubjectIcon = (subjectCode: string) => {
    switch (subjectCode) {
        case 'NL':
            return nl_img;
        case 'FR':
            return fr_img;
        case 'EN':
            return eng_img;
        case 'DE':
            return de_img;
        case 'WI':
            return math_img;
        case 'NSK':
            return nsk_img;
        case 'AK':
            return ak_img;
        default:
            return null;
    }
};

// Function to get the full subject name
const getSubjectName = (subjectCode: string) => {
    switch (subjectCode) {
        case 'NL':
            return 'Nederlands';
        case 'FR':
            return 'Frans';
        case 'EN':
            return 'Engels';
        case 'DE':
            return 'Duits';
        case 'WI':
            return 'Wiskunde';
        case 'NSK':
            return 'NaSk';
        case 'AK':
            return 'Aardrijkskunde';
        default:
            return subjectCode;
    }
};

export default async function Page({ params }: PageProps) {
    // Await the Promise to get the actual params
    const { name, selectedTab } = await params;

    const user = await prisma.user.findFirst({
        where: {
            name: name
        },
    });

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 space-y-6">
                <h1 className="text-5xl font-bold text-red-600">☹️ Oeps!</h1>
                <p className="mt-2 text-2xl">De opgegeven gebruiker is niet gevonden</p>
                <Button1 text={"Terug naar leren"} redirectTo={'/home/start'} />
            </div>
        )
    }

    // Safely access list data with optional chaining and type casting
    const listdata = user?.list_data as ListData | undefined;

    // Fetch the actual list details if there are created lists
    const createdLists: PracticeList[] = listdata?.created_lists && listdata.created_lists.length > 0
        ? await prisma.practice.findMany({
            where: {
                list_id: {
                    in: listdata.created_lists
                }
            },
            select: {
                list_id: true,
                name: true,
                subject: true,
                createdAt: true
            }
        })
        : [];

    // Generate Identicon SVG as fallback
    const svg = jdenticon.toSvg(user?.name || "default", 100);

    // Define tabs for this specific page
    const tabs: TabItem[] = [
        {
            id: 'lists',
            label: 'Gemaakte lijsten',
            content: (
                <div className="mt-4">
                    {createdLists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {createdLists.map((list: { subject: string; list_id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; createdAt: string | number | Date; }) => {
                                const subjectIcon = getSubjectIcon(list.subject);
                                return (
                                    <Link
                                        key={list.list_id}
                                        href={`/learn/viewlist/${list.list_id}`}
                                        className="block transition-transform"
                                    >
                                        <div className="bg-neutral-800 p-4 rounded-lg shadow hover:bg-neutral-700 transition-colors">
                                            <div className="flex items-center mb-2">
                                                {subjectIcon && (
                                                    <div className="mr-2">
                                                        <Image src={subjectIcon} alt={`${getSubjectName(list.subject)} icon`} width={24} height={24} />
                                                    </div>
                                                )}
                                                <h3 className="text-lg font-semibold">{list.name}</h3>
                                            </div>
                                            <p className="text-sm text-gray-400">Vak: {getSubjectName(list.subject)}</p>
                                            <p className="text-xs text-gray-500">
                                                Gemaakt op: {new Date(list.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500">
                            Geen lijsten gevonden
                            {listdata?.created_lists && listdata.created_lists.length > 0 ?
                                ` (${listdata.created_lists.length} IDs gevonden, maar geen lijsten)` : ''}
                        </p>
                    )}
                </div>
            )
        },
        {
            id: 'groups',
            label: 'Groepen',
            content: (
                <div>
                    {/* Groups content will go here */}
                    <Image src={construction} alt="under construction!" width={500} height={100} />
                </div>
            )
        },
        {
            id: 'achievements',
            label: 'Prestaties',
            content: (
                <div>
                    {/* Achievements content will go here */}
                    <Image src={construction} alt="under construction!" width={500} height={100} />
                </div>
            )
        }
    ];

    return (
        <div className="pt-4">
            <div className="space-x-5 flex flex-row items-center pl-2">
                {user?.image ? (
                    <Image
                        src={user.image}
                        alt={`${user.name}'s Avatar`}
                        width={100}
                        height={100}
                        className="rounded-full"
                    />
                ) : (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: svg,
                        }}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            overflow: 'hidden'
                        }}
                    />
                )}
                <h1 className="text-2xl font-bold">{user?.name}</h1>
            </div>
            <div className="h-4" />
            <div className="pl-4">
                <Tabs
                    tabs={tabs}
                    defaultActiveTab={selectedTab || "lists"}
                    withRoutes={true}
                    baseRoute={`/home/viewuser/${name}`} // Use params.name directly since we know it exists
                />
            </div>
        </div>
    );
}