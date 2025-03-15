import { prisma } from "@/utils/prisma"
import { NextPage } from 'next';
import Link from "next/link";
import Tabs, { TabItem } from "@/components/Tabs";
import Dropdown from "@/components/button/DropdownBtn";
import React from 'react';

import Image from "next/image";
import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/english.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';

import learn from '@/app/img/learn.svg';
import test from '@/app/img/test.svg';
import hints from '@/app/img/hint.svg';
import mind from '@/app/img/mind.svg';
import livequiz from '@/app/img/livequiz.svg';

import construction from '@/app/img/construction.gif';
import Button1 from "@/components/button/Button1";

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
    const listData = await prisma.practice.findFirst({
        where: {
            list_id: (await params).id
        },
        select: {
            list_id: true,
            name: true,
            data: true,
        }
    })
    let lijst_items: WordPair[] = [];
    if (listData?.data && Array.isArray(listData.data)) {
        if (isWordPairArray(listData.data)) {
            lijst_items = listData.data;
        }
    }

    lijst_items.sort(() => Math.random() - 0.5);

    return (
        <div className="px-4">
            <h1 id="vraag">{lijst_items[0]["1"]}</h1>
            <p id="antwoord">{lijst_items[0]["2"]}</p>
        </div>
    )
}

export default ViewListPage;