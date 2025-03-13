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

  const recentListIds = (account?.list_data as any)?.recent_lists || [];
  const createdListIds = (account?.list_data as any)?.created_lists || [];
  const combinedListIds = [...recentListIds, ...createdListIds];

  if (combinedListIds.length > 0) {
    const lists = await prisma.practice.findMany({
      where: {
        list_id: {
          in: combinedListIds
        }
      }
    });

    const orderedLists = combinedListIds
      .map((id: string) => lists.find(list => list.list_id === id))
      .filter(Boolean);

    return orderedLists;
  }

  return [];
}

export default async function Start() {
  const recentSubjects = await getRecentSubjects();
  const recentLists = await getRecentLists();

  const subjectEmojiMap: Record<string, React.ReactNode> = {
    "NL": <Image src={nl_img} alt="nederlands plaatje" width={20} height={20} />,
    "DE": <Image src={de_img} alt="duits plaatje" width={20} height={20} />,
    "FR": <Image src={fr_img} alt="frans plaatje" width={20} height={20} />,
    "EN": <Image src={eng_img} alt="engels plaatje" width={20} height={20} />,
    "WI": <Image src={math_img} alt="wiskunde plaatje" width={20} height={20} />,
    "NSK": <Image src={nsk_img} alt="nask plaatje" width={20} height={20} />,
    "GS": <Image src={gs_img} alt="geschiedenis plaatje" width={20} height={20} />,
    "BI": <Image src={bi_img} alt="biologie plaatje" width={20} height={20} />,
  };

  return (
    <>
      <div className="flex">
        <div className="subjects">
          <h1 className="text-4xl pl-5 pt-4 font-extrabold">Recente Vakken:</h1>
          <div>
            <div className="flex pt-5 pl-5 space-x-4 relative overflow-hidden w-screen">
              {recentSubjects.length === 0 ? (
                <p className="absolute top-[35px] w-full pl-9 text-neutral-400 font-bold">
                  Je hebt nog geen vakken geoefend. Leer een lijst van een bepaalde vak, en de geoefende vak van de lijst komt hier.
                </p>
              ) : (
                recentSubjects.map((subject: string, index: number) => (
                  <div key={index} className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid">
                    {subjectEmojiMap[subject] || subject}
                  </div>
                ))
              )}
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
              {recentLists.length === 0 ? (
                <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
                  Je hebt nog geen lijsten geoefend. Leer een lijst, en de geoefende lijst komt hier.
                </div>
              ) : (
                recentLists.map((list: any, index: number) => (
                  <Link href={`/learn/viewlist/${list.list_id}`} key={index}>
                    <div className="tile bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg h-20 flex items-center justify-between cursor-pointer">
                      <div className="flex flex-col text-left">
                        <div className="flex items-center">
                          {list.subject && subjectEmojiMap[list.subject]}
                          <span className="text-lg">{list.name}</span>
                        </div>
                      </div>
                      {list.creator && <CreatorLink creator={list.creator} />}
                      <div className="text-neutral-400 text-sm">
                        {Array.isArray(list.data) ? `${list.data.length} woorden` : "0 woorden"}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
