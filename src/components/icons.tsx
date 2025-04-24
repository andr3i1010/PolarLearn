// Dit is een verzameling van de leericonen die worden gebruikt in de app

import Image from "next/image"
import nsk_img from '@/app/img/nask.svg'
import wis_img from '@/app/img/math.svg'
import eng_img from '@/app/img/english.svg'
import fr_img from '@/app/img/baguette.svg'
import de_img from '@/app/img/pretzel.svg'
import nl_img from '@/app/img/nl.svg'
import gs_img from '@/app/img/history.svg'
import bi_img from '@/app/img/bio.svg'
import ak_img from '@/app/img/geography.svg'

export const icons = {
    nask: nsk_img,
    wiskunde: wis_img,
    engels: eng_img,
    frans: fr_img,
    duits: de_img,
    nederlands: nl_img,
    geschiedenis: gs_img,
    biologie: bi_img,
    aardrijkskunde: ak_img,
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
        default:
            return null;
    }
};

// Function to get the full subject name
export const getSubjectName = (subjectCode: string) => {
    switch (subjectCode) {
        case "NL":
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
        default:
            return subjectCode;
    }
};