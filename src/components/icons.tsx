// Dit is een verzameling van de leericonen die worden gebruikt in de app

import Image from "next/image"
import { memo } from "react"

interface ComboboxItem {
    value: string;
    label: React.ReactNode;
    searchText: string;
}

import nsk_img from '@/app/img/nask.svg'
import wis_img from '@/app/img/math.svg'
import eng_img from '@/app/img/english.svg'
import fr_img from '@/app/img/baguette.svg'
import de_img from '@/app/img/pretzel.svg'
import nl_img from '@/app/img/nl.svg'
import gs_img from '@/app/img/history.svg'
import bi_img from '@/app/img/bio.svg'
import ak_img from '@/app/img/geography.svg'
import la_img from '@/app/img/oude_taal1.svg'
import gr_img from '@/app/img/oude_taal2.svg'


export const icons = {
    NSK: nsk_img,
    WI: wis_img,
    EN: eng_img,
    FR: fr_img,
    DE: de_img,
    NL: nl_img,
    NE: nl_img,
    GS: gs_img,
    BI: bi_img,
    AK: ak_img,
    GR: gr_img,
    LA: la_img
} as const

export const subjectEmojiMap: Record<string, React.ReactNode> = {
    "NL": (
        <span className="flex items-center">
            <Image src={nl_img} alt={"nederlands plaatje"} width={20} height={20} />
            <div className="w-2" />
            Nederlands
        </span>
    ),
    "DE": (
        <span className="flex items-center">
            <Image src={de_img} alt={"duits plaatje"} width={20} height={20} />
            <div className="w-2" />
            Duits
        </span>
    ),
    "FR": (
        <span className="flex items-center">
            <Image src={fr_img} alt={"frans plaatje"} width={20} height={20} />
            <div className="w-2" />
            Frans
        </span>
    ),
    "EN": (
        <span className="flex items-center">
            <Image src={eng_img} alt={"engels plaatje"} width={20} height={20} />
            <div className="w-2" />
            Engels
        </span>
    ),
    "WI": (
        <span className="flex items-center">
            <Image src={wis_img} alt={"wiskunde plaatje"} width={20} height={20} />
            <div className="w-2" />
            Wiskunde
        </span>
    ),
    "NSK": (
        <span className="flex items-center">
            <Image src={nsk_img} alt={"nask plaatje"} width={20} height={20} />
            <div className="w-2" />
            NaSk
        </span>
    ),
    "GS": (
        <span className="flex items-center">
            <Image src={gs_img} alt={"geschiedenis plaatje"} width={20} height={20} />
            <div className="w-2" />
            Geschiedenis
        </span>
    ),
    "BI": (
        <span className="flex items-center">
            <Image src={bi_img} alt={"biologie plaatje"} width={20} height={20} />
            <div className="w-2" />
            Biologie
        </span>
    ),
    "AK": (
        <span className="flex items-center">
            <Image src={ak_img} alt={"aardrijkskunde plaatje"} width={20} height={20} />
            <div className="w-2" />
            Aardrijkskunde
        </span>
    ),
    "LA": (
        <span className="flex items-center">
            <Image src={la_img} alt={"Latijn plaatje"} width={20} height={20} />
            <div className="w-2" />
            Latijn
        </span>
    ),
    "GR": (
        <span className="flex items-center">
            <Image src={gr_img} alt={"Grieks plaatje"} width={20} height={20} />
            <div className="w-2" />
            Grieks
        </span>
    ),
} as const;

// Function to get the appropriate icon for each subject
export const getSubjectIcon = (subjectCode: string) => {
    switch (subjectCode) {
        case "NL":
            return nl_img;
        case "FR":
            return fr_img;
        case "EN":
            return eng_img;
        case "DE":
            return de_img;
        case "WI":
            return wis_img;
        case "NSK":
            return nsk_img;
        case "AK":
            return ak_img;
        case "GS":
            return gs_img;
        case "BI":
            return bi_img;
        case "LA":
            return la_img;
        case "GR":
            return gr_img;
        default:
            return null;
    }
};

// Function to get the full subject name
export const getSubjectName = (subjectCode: string) => {
    switch (subjectCode) {
        case "NL":
            return "Nederlands";
        case "NE":
            return "Nederlands";
        case "FR":
            return "Frans";
        case "EN":
            return "Engels";
        case "DE":
            return "Duits";
        case "WI":
            return "Wiskunde";
        case "NSK":
            return "NaSk";
        case "AK":
            return "Aardrijkskunde";
        case "GS":
            return "Geschiedenis";
        case "BI":
            return "Biologie";
        case "LA":
            return "Latijn";
        case "GR":
            return "Grieks";
        default:
            return subjectCode;
    }
};
const SubjectLabel = memo(({ icon, alt, label }: { icon: any; alt: string; label: string }) => (
    <div className="flex items-center">
        <Image src={icon} alt={alt} width={24} height={24} className="mr-2" />
        <span>{label}</span>
    </div>
));
export const defaultItems: ComboboxItem[] = [
    {
        value: "WI",
        label: <SubjectLabel icon={icons.WI} alt="wiskunde" label="Wiskunde" />,
        searchText: "Wiskunde",
    },
    {
        value: "NSK",
        label: <SubjectLabel icon={icons.NSK} alt="nask" label="NaSk" />,
        searchText: "NaSk",
    },
    {
        value: "NE",
        label: <SubjectLabel icon={icons.NL} alt="nederlands" label="Nederlands" />,
        searchText: "Nederlands",
    },
    {
        value: "EN",
        label: <SubjectLabel icon={icons.EN} alt="engels" label="Engels" />,
        searchText: "Engels",
    },
    {
        value: "FR",
        label: <SubjectLabel icon={icons.FR} alt="frans" label="Frans" />,
        searchText: "Frans",
    },
    {
        value: "DE",
        label: <SubjectLabel icon={icons.DE} alt="duits" label="Duits" />,
        searchText: "Duits",
    },
    {
        value: "AK",
        label: <SubjectLabel icon={icons.AK} alt="aardrijkskunde" label="Aardrijkskunde" />,
        searchText: "Aardrijkskunde",
    },
    {
        value: "GS",
        label: <SubjectLabel icon={icons.GS} alt="geschiedenis" label="Geschiedenis" />,
        searchText: "Geschiedenis",
    },
    {
        value: "LA",
        label: <SubjectLabel icon={icons.LA} alt="Latijn" label="Latijn" />,
        searchText: "Latijn",
    },
    {
        value: "GR",
        label: <SubjectLabel icon={icons.GR} alt="Grieks" label="Grieks" />,
        searchText: "Grieks",
    }
];
