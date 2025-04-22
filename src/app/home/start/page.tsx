import { prisma } from "@/utils/prisma";
import Image from 'next/image';
import PlusBtn from "@/components/button/plus";
import Link from 'next/link';
import CreatorLink from "@/components/links/CreatorLink";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DeleteListButton from "@/components/learning/DeleteListButton";

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
import Jdenticon from "@/components/Jdenticon";

async function getRecentSubjects() {
  const user = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string)
  const account = await prisma.user.findUnique({
    where: { id: user?.id },
  });
  return (account?.list_data as any)?.recent_subjects || [];
}

// Define a more complete interface for practice list items
interface PracticeListItem {
  id: string;
  list_id: string;
  name: string;
  mode: string;
  subject: string;
  lang_from: string;
  lang_to: string;
  data: any;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

async function getRecentLists() {
  const user = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string)
  if (!user) return [];

  const account = await prisma.user.findUnique({
    where: { id: user.id }
  });

  const listData = account?.list_data as any || {};

  // Get recently practiced lists - this array contains the IDs in order of recency
  const recentListIds = Array.isArray(listData.recent_lists)
    ? listData.recent_lists.filter(Boolean)
    : [];

  // Get user-created lists
  const createdListIds = Array.isArray(listData.created_lists)
    ? listData.created_lists.filter(Boolean)
    : [];

  // Create combined list of IDs to fetch
  const combinedListIds = [...recentListIds, ...createdListIds].filter(Boolean);

  // If we have no valid list IDs and no user, return empty array
  if (combinedListIds.length === 0 && !user?.name) return [];

  // Fetch all relevant lists
  const lists = await prisma.practice.findMany({
    where: {
      OR: [
        // Only include the list ID condition if we have IDs
        ...(combinedListIds.length > 0 ? [{
          list_id: { in: combinedListIds }
        }] : []),
        // Also include lists created by this user
        { creator: user.name as string }
      ]
    }
  });

  // Create a map for quick lookup of the list's position in recentListIds
  interface RecentListPositions {
    [listId: string]: number;
  }

  const recentListIdPositions: RecentListPositions = Object.fromEntries(
    recentListIds.map((id: string, index: number) => [id, index])
  );

  // More sophisticated sorting that prioritizes recently practiced lists
  return lists.sort((a: { list_id: string; updatedAt: string | number | Date; }, b: { list_id: string; updatedAt: string | number | Date; }) => {
    // First, check if both lists are in recentListIds
    const aInRecent = a.list_id in recentListIdPositions;
    const bInRecent = b.list_id in recentListIdPositions;

    if (aInRecent && bInRecent) {
      // Both lists are recently practiced, compare their positions in recentListIds
      return recentListIdPositions[a.list_id] - recentListIdPositions[b.list_id];
    } else if (aInRecent) {
      // Only a is recently practiced, so a comes first
      return -1;
    } else if (bInRecent) {
      // Only b is recently practiced, so b comes first
      return 1;
    } else {
      // Neither is recently practiced, fallback to updatedAt timestamp
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });
}

// Add this new function to fetch user's groups
async function getUserGroups() {
  const user = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);
  if (!user) return [];

  const userData = await prisma.user.findUnique({
    where: { id: user.id }
  });

  // Get IDs of groups the user is in
  const userOwnGroups = (userData?.ownGroups as string[]) || [];
  const userInGroups = (userData?.inGroups as string[]) || [];

  // Combine and deduplicate group IDs
  const allUserGroupIds = [...new Set([...userOwnGroups, ...userInGroups])];

  if (allUserGroupIds.length === 0) return [];

  // Fetch all groups the user is a member of
  return await prisma.group.findMany({
    where: {
      OR: [
        { groupId: { in: allUserGroupIds } },
        // Remove the problematic members query
        { creator: user.id }
      ]
    },
    orderBy: { updatedAt: 'desc' },
    take: 5 // Limit to 5 most recent groups
  });
}

export default async function Start() {
  const recentSubjects = await getRecentSubjects();
  const recentLists = await getRecentLists();
  const userGroups = await getUserGroups();

  // Get current user name once to use in comparisons
  const currentUser = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);
  const currentUserName = currentUser?.name;

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
      <div className="flex flex-col">
        <div className="subjects">
          <h1 className="text-4xl pl-5 pt-4 font-extrabold">Recente Vakken:</h1>
          <div>
            <div className="flex pt-5 pl-5 space-x-4 relative overflow-hidden w-screen">
              {recentSubjects.length === 0 && (
                <>
                  <p className="absolute top-[35px] w-full pl-9 text-neutral-400 font-bold">
                    Je hebt nog geen vakken geoefend. Leer een lijst van een bepaalde vak, en de geoefende vak van de lijst komt hier.
                  </p>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>

                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>
                </>
              )}
              {recentSubjects.map((subject: string, index: number) => (
                <Link
                  key={index}
                  href={`/learn/subjects/${subject}`}
                  className="tile bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid transition-colors"
                >
                  {
                    (() => {
                      return subjectEmojiMap[subject] ? subjectEmojiMap[subject] : "";
                    })()
                  }
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="recent-lists mt-8">
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
                  <div key={list.list_id}>
                    <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                      <Link href={`/learn/viewlist/${list.list_id}`} className="flex-1 flex items-center" key={index}>
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
                                            list.subject === "AK" ? ak_img :
                                              list.subject === "GS" ? gs_img :
                                                list.subject === "BI" ? bi_img : ''
                              }
                              alt={`${list.subject} icon`}
                              width={24}
                              height={24}
                              className="mr-2"
                            />
                          )}
                          <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                            {list.name}
                            {list.published === false && (
                              <Badge
                                variant="secondary"
                                className="ml-2 bg-amber-600/20 text-amber-500 border border-amber-600/50 text-xs"
                              >
                                Concept
                              </Badge>
                            )}
                          </span>
                        </div>
                        <div className="flex-grow"></div>
                        <div className="flex items-center pr-2">
                          {Array.isArray(list.data) && list.data.length === 1
                            ? "1 woord"
                            : `${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                        </div>
                      </Link>

                      {list.creator && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                          <CreatorLink creator={list.creator} />
                        </div>
                      )}

                      {/* Action buttons for list owner */}
                      <div className="flex items-center gap-2">
                        {list.creator === currentUserName && (
                          <Link
                            href={`/learn/editlist/${list.list_id}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                            title="Lijst bewerken"
                          >
                            <PencilIcon className="h-5 w-5 text-white" />
                          </Link>
                        )}
                        {list.creator === currentUserName && (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                            <DeleteListButton
                              listId={list.list_id}
                              isCreator={list.creator === currentUserName}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="h-4" />
    </>
  );
}