"use client"
import { useRef, useState } from "react";
import Dropdown, { DropdownHandle } from "@/components/button/DropdownBtn";
import CreateListTool from "@/components/learning/createList";

import nsk_img from '@/app/img/nask.svg'
import math_img from '@/app/img/math.svg'
import eng_img from '@/app/img/english.svg'
import fr_img from '@/app/img/baguette.svg'
import de_img from '@/app/img/pretzel.svg'
import nl_img from '@/app/img/nl.svg'
import ak_img from '@/app/img/geography.svg'
import Image from "next/image";

export default function CreateListPage() {
  const dropdownRef = useRef<DropdownHandle>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);

  return (
    <div className="mx-2">
      <div className="text-center">
        <h1 className="text-4xl pt-4 font-extrabold">Nieuwe Lijst</h1>
      </div>
      <div className="h-3" />
      <form className="relative z-50">
        <Dropdown   
          ref={dropdownRef}
          text="Kies een vak"
          width={200}
          dropdownMatrix={[
            [
              (
                <div className="flex items-center gap-2">
                  <Image src={nl_img} alt="nederlands plaatje" width={20} height={20} />
                  <p>Nederlands</p>
                </div>
              ),
              "NL"
            ],
            [(
                <div className="flex items-center gap-2">
                  <Image src={math_img} alt="wiskunde plaatje" width={20} height={20} />
                  <p>Wiskunde</p>
                </div>
            ), "WI"],
            [(
                <div className="flex items-center gap-2">
                  <Image src={nsk_img} alt="nask plaatje" width={20} height={20} />
                  <p>NaSk</p>
                </div>
            ), "NSK"],
            [(
                <div className="flex items-center gap-2">
                  <Image src={ak_img} alt="aardrijkskunde plaatje" width={20} height={20} />
                  <p>Aardrijkskunde</p>
                </div>
            ), "AK"],
            [(
                <div className="flex items-center gap-2">
                  <Image src={fr_img} alt="frans plaatje" width={20} height={20} />
                  <p>Frans</p>
                </div>
            ), "FR"],
            [(<div className="flex items-center gap-2">
                <Image src={eng_img} alt="engels plaatje" width={20} height={20} />
                <p>Engels</p>
            </div>), "EN"],
            [(<div className="flex items-center gap-2">
                <Image src={de_img} alt="duits plaatje" width={20} height={20} />
                <p>Duits</p>
            </div>), "DE"]
          ]}
          selectorMode={true}
          onChange={(selected) => {setSelectedLanguage(selected);}}
        />
        <input
          className="mt-16 bg-neutral-800 text-white h-12 w-full rounded-lg text-center text-xl"
          type="text"
          placeholder="Lijstnaam komt hier"
        />
      </form>
      <div className="flex items-center my-4">
        <hr className="flex-grow border-[1px] border-neutral-600" />
      </div>
      <CreateListTool language={selectedLanguage} />
    </div>
  );
}