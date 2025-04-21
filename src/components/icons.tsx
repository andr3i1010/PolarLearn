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
    nask_img: nsk_img,
    wis_img: wis_img,
    eng_img: eng_img,
    fr_img: fr_img,
    de_img: de_img,
    nl_img: nl_img,
    gs_img: gs_img,
    bi_img: bi_img,
    ak_img: ak_img,
    wiskunde_img: wis_img,
    geschiedenis_img: gs_img,
    biologie_img: bi_img,
    aardrijkskunde_img: ak_img,
    engels_img: eng_img,
    frans_img: fr_img,
    duits_img: de_img,
    nederlands_img: nl_img,
    nask_icon: nsk_img,
    wiskunde_icon: wis_img,
    geschiedenis_icon: gs_img,
    biologie_icon: bi_img,
    aardrijkskunde_icon: ak_img,
    engels_icon: eng_img,
    frans_icon: fr_img,
    duits_icon: de_img,
    nederlands_icon: nl_img,
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

// Subject labels
export const subjectLabelMap: Record<string, string> = {
    AK: "Aardrijkskunde",
    BI: "Biologie",
    DE: "Duits",
    EN: "Engels",
    FR: "Frans",
    GS: "Geschiedenis",
    NA: "Natuurkunde",
    NSK: "NaSk",
    NE: "Nederlands",
    SK: "Scheikunde",
    WI: "Wiskunde",
} as const;