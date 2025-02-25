import { prisma } from "@/utils/prisma";
import { userInfo } from '@/utils/datatool';
import Image from 'next/image';
import PlusBtn from "@/components/button/plus";

// Subject images //
import nsk_img from '@/app/img/nask.svg'
import math_img from '@/app/img/math.svg'
import eng_img from '@/app/img/english.svg'
import fr_img from '@/app/img/baguette.svg'
import de_img from '@/app/img/pretzel.svg'
import nl_img from '@/app/img/nl.svg'

async function getRecentSubjects() {
  const user = await userInfo();
  const account = await prisma.user.findUnique({
    where: { id: user?.id },
  });
  return (account?.list_data as any)?.recent_subjects || [];
}

async function getRecentLists() {
  const user = await userInfo();
  const account = await prisma.user.findUnique({
    where: { id: user?.id }
  })
  return (account?.list_data as any)?.recent_lists || []
}

export default async function Start() {
  const recentSubjects = await getRecentSubjects();
  const recentLists    = await getRecentLists();
  return (
    <>
      <div className="flex">
        <div className="subjects">
          <h1 className="text-4xl pl-5 pt-4 font-extrabold">Recente Vakken:</h1>
          <div>
            <div className="flex pt-5 pl-5 space-x-4 relative overflow-hidden w-screen">
              {recentSubjects.length === 0 && (
                <>
                  <p className="absolute top-[35px] w-full pl-16 text-neutral-400 font-bold">
                    Je hebt nog geen vakken geoefend. Leer een lijst van een bepaalde vak, en de geoefende vak van de lijst komt hier.
                  </p>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"></div>
                </>
              )}
              {recentSubjects.map((subject: string, index: number) => (
                <div
                  key={index}
                  className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"
                >
                  {
                    (() => {
                        const subjectEmojiMap: Record<string, React.ReactNode> = {
                          "NL": (
                            <span className="flex items-center">
                              <Image src={nl_img} alt={"nederlands plaatje"} width={20} height={20}/>
                              <div className="w-2"/>
                              Nederlands
                            </span>
                          ),
                          "DE": (
                            <span className="flex items-center">
                              <Image src={de_img} alt={"duits plaatje"} width={20} height={20}/>
                              <div className="w-2"/>
                              Duits
                            </span>
                          ),
                          "FR": (
                            <span className="flex items-center">
                              <Image src={fr_img} alt={"frans plaatje"} width={20} height={20}/>
                              <div className="w-2"/>
                              Frans
                            </span>
                          ),
                          "EN": (
                            <span className="flex items-center">
                              <Image src={eng_img} alt={"engels plaatje"} width={20} height={20}/>
                              <div className="w-2"/>
                              Engels
                            </span>
                          ),
                          "WI": (
                            <span className="flex items-center">
                              <Image src={math_img} alt={"wiskunde plaatje"} width={20} height={20}/>
                              <div className="w-2"/>
                              Wiskunde
                            </span>
                          ),
                          "NSK": (
                            <span className="flex items-center">
                              <Image src={nsk_img} alt={"nask plaatje"} width={20} height={20}/>
                              <div className="w-2"/>
                              NaSk
                            </span>
                          ),
                          
                        };
                        return subjectEmojiMap[subject] ? subjectEmojiMap[subject] : "";
                    })()
                  }
                </div>
              ))}
            </div>
            <div className="h-3"/>
            <div className="flex items-center text-center">
                <h1 className="text-4xl pl-5 pt-4 mb-2 font-extrabold">Recente Lijsten:</h1>
                <div className="ml-auto mr-5">
                  <PlusBtn redir="/learn/createlist" />
                </div>
            </div>
            <div className="h-4"/>
            <div className="space-y-4">
              {recentLists.length == 0 && (
                <>
                  <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
                  Je hebt nog geen lijsten geoefend. Leer een lijst, en de geoefende lijst komt hier.
                  </div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid"></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="h-4"/>
    </>
  );
}