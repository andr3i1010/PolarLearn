// Dit is een verzameling van de vakken en icons die worden gebruikt op de website
import Image from "next/image"
import { memo } from "react"

interface ComboboxItem {
    value: string;
    label: React.ReactNode;
    searchText: string;
}

import nsk_img from '@/app/img/nask.svg'
import wis_img from '@/app/img/math.svg'
import eng_img from '@/app/img/tea_innit.svg'
import fr_img from '@/app/img/baguette.svg'
import de_img from '@/app/img/pretzel.svg'
import nl_img from '@/app/img/nl.svg'
import gs_img from '@/app/img/history.svg'
import bi_img from '@/app/img/bio.svg'
import ak_img from '@/app/img/geography.svg'
import la_img from '@/app/img/oude_taal1.svg'
import mu_img from '@/app/img/muziek.svg'
import ot_img from '@/app/img/anders.svg'
import gl_img from '@/app/img/gl.svg'
import gr_img from '@/app/img/oude_taal2.svg'
import ckv_img from '@/app/img/ckv.svg'

// als je een vak wil toevoegen voeg die toe aan vakken verder hoef je niks te doen!!

interface taal {
    afkorting: string;
    naam: string;
    icon: any;
}

interface vak {
    afkorting: string;
    naam: string;
    icon: any;
    istaal: boolean;
    van: taal;
    naar: taal;
}

export const Vakken: vak[] = [
    {
        afkorting: "EN",
        naam: "Engels",
        icon: eng_img,
        istaal: true,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "EN", naam: "Engels", icon: eng_img }
    },
    {
        afkorting: "FR",
        naam: "Frans",
        icon: fr_img,
        istaal: true,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "FR", naam: "Frans", icon: fr_img }
    },
    {
        afkorting: "DE",
        naam: "Duits",
        icon: de_img,
        istaal: true,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "DE", naam: "Duits", icon: de_img }
    },
    {
        afkorting: "NL",
        naam: "Nederlands",
        icon: nl_img,
        istaal: true,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "LA",
        naam: "Latijn",
        icon: la_img,
        istaal: true,
        van: { afkorting: "LA", naam: "Latijn", icon: la_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "GR",
        naam: "Grieks",
        icon: gr_img,
        istaal: true,
        van: { afkorting: "GR", naam: "Grieks", icon: gr_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "WI",
        naam: "Wiskunde",
        icon: wis_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "NSK",
        naam: "NaSk",
        icon: nsk_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "BI",
        naam: "Biologie",
        icon: bi_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "AK",
        naam: "Aardrijkskunde",
        icon: ak_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "GS",
        naam: "Geschiedenis",
        icon: gs_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "MU",
        naam: "Muziek",
        icon: mu_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "OT",
        naam: "Anders",
        icon: ot_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "GL",
        naam: "Godsdienst / Levensbeschouwing",
        icon: gl_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    },
    {
        afkorting: "CKV",
        naam: "CKV",
        icon: ckv_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    }
];

// hierna komen lijsten die info halen van vakken
export const krijgVak = (subjectCode: string): vak => {
    return Vakken.find(v => v.afkorting === subjectCode) ?? {
        afkorting: "??",
        naam: "Onbekend",
        icon: nl_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    };
};
export const krijgTaalVaken = (): vak[] => {
    return Vakken.filter(vak => vak.istaal) ?? {
        afkorting: "??",
        naam: "Onbekend",
        icon: nl_img,
        istaal: false,
        van: { afkorting: "NL", naam: "Nederlands", icon: nl_img },
        naar: { afkorting: "NL", naam: "Nederlands", icon: nl_img }
    };
};
export const subjectEmojiMap: Record<string, React.ReactNode> = Object.fromEntries(
    Vakken.map(vak => [
        vak.afkorting,
        <span key={vak.afkorting} className="flex items-center">
            <Image src={vak.icon} alt={`${vak.naam.toLowerCase()} plaatje`} width={20} height={20} />
            <div className="w-2" />
            {vak.naam}
        </span>
    ])
);
// deze lijsten moet je eig niet gebruiken

export const getSubjectIcon = (subjectCode: string) => {
    const vak = Vakken.find(v => v.afkorting === subjectCode);
    return vak?.icon ?? null;
};

export const getSubjectName = (subjectCode: string) => {
    const vak = Vakken.find(v => v.afkorting === subjectCode);
    return vak?.naam ?? subjectCode;
};
const SubjectLabel = memo(({ icon, alt, label }: { icon: any; alt: string; label: string }) => (
    <div className="flex items-center">
        <Image src={icon} alt={alt} width={24} height={24} className="mr-2" />
        <span>{label}</span>
    </div>
));
export const defaultItems: ComboboxItem[] = Vakken.map(vak => ({
    value: vak.afkorting,
    label: <SubjectLabel icon={vak.icon} alt={vak.naam.toLowerCase()} label={vak.naam} />,
    searchText: vak.naam,
}));
export const icons = Object.fromEntries(
    Vakken.map(vak => [vak.afkorting, vak.icon])
) as Record<string, any>;
