import { prisma } from "@/utils/prisma";
import { userInfo } from '@/utils/datatool';
import Image from 'next/image';
import PlusBtn from "@/components/button/plus";
import Link from 'next/link';
import CreatorLink from "@/components/links/CreatorLink";

// Subject images //
import nsk_img from '@/app/img/nask.svg'
import math_img from '@/app/img/math.svg'
import eng_img from '@/app/img/english.svg'
import fr_img from '@/app/img/baguette.svg'
import de_img from '@/app/img/pretzel.svg'
import nl_img from '@/app/img/nl.svg'
import gs_img from '@/app/img/history.svg'
import bi_img from '@/app/img/bio.svg'
import ak_img from '@/app/img/geography.svg'

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
  });

  // Get list IDs from user's recent_lists and created_lists
  const recentListIds = (account?.list_data as any)?.recent_lists || [];
  const createdListIds = (account?.list_data as any)?.created_lists || [];
  const combinedListIds = [...recentListIds, ...createdListIds];

  // Fetch complete list data from the database if we have IDs
  if (combinedListIds.length > 0) {
    const lists = await prisma.practice.findMany({
      where: {
        list_id: {
          in: combinedListIds
        }
      }
    });

    // Sort lists based on the combined order of recent and created lists
    const orderedLists = combinedListIds
      .map((id: string) => lists.find((list: { list_id: string; }) => list.list_id === id))
      .filter(Boolean);

    return orderedLists;
  }

  return [];
}

export default async function Start() {
  const recentSubjects = await getRecentSubjects();
  const recentLists = await getRecentLists();

  // Extract the subject emoji map for reuse
  const subjectEmojiMap: Record<string, React.ReactNode> = {
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
        <Image src={math_img} alt={"wiskunde plaatje"} width={20} height={20} />
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
  };

  return (
    <>
      <div className="flex">
        <div className="subjects">
          <h1 className="text-4xl pl-5 pt-4 font-extrabold">Recente Vakken:</h1>
          <div>
            <div className="flex pt-5 pl-5 space-x-4 relative overflow-hidden w-screen">
              {recentSubjects.length === 0 && (
                <>
                  <p className="absolute top-[35px] w-full pl-9 text-neutral-400 font-bold">
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
                      return subjectEmojiMap[subject] ? subjectEmojiMap[subject] : "";
                    })()
                  }
                </div>
              ))}
            </div>
            <div className="h-3" />
            <div className="flex items-center text-center">
              <h1 className="text-4xl pl-5 pt-4 mb-2 font-extrabold">Recente Lijsten:</h1>
              <div className="ml-auto mr-5">
                <PlusBtn redir="/learn/createlist" />
              </div>
            </div>
            <div className="h-4" />
            <div className="space-y-4">
              {recentLists.length == 0 && (
                <>
                  <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
                    Je hebt nog geen lijsten geoefend. Leer een lijst, en de geoefende lijst komt hier.
                  </div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid "></div>
                </>
              )}
              {recentLists.length > 0 && (
                <>
                  {recentLists.map((list: any, index: number) => (
                    <div >
                      <Link href={`/learn/viewlist/${list.list_id}`} key={index}>
                        <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                          {/* Left: subject icon & listname */}
                          <div className="flex items-center">
                            {list.subject && (
                              <Image
                                src={
                                  list.subject === "NL" ? nl_img :
                                    list.subject === "DE" ? de_img :
                                      list.subject === "FR" ? fr_img :
                                        list.subject === "EN" ? eng_img :
                                          list.subject === "WI" ? math_img :
                                            list.subject === "NSK" ? nsk_img :
                                              list.subject === "AK" ? ak_img :  // added geography subject case
                                                list.subject === "GS" ? gs_img :
                                                  list.subject === "BI" ? bi_img : ''
                                }
                                alt={`${list.subject} icon`}
                                width={24}
                                height={24}
                                className="mr-2"
                              />
                            )}
                            <span className="text-lg whitespace-normal break-words max-w-[40ch]">{list.name}</span>
                          </div>

                          <div className="flex items-center">
                            {Array.isArray(list.data) && list.data.length === 1
                              ? "1 woord"
                              : `${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                          </div>

                          {/* Center: creator link absolutely centered */}
                          {list.creator && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                              <CreatorLink creator={list.creator} />
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div >
      <div className="h-4" />
    </>
  );
}