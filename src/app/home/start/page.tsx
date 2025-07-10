import { prisma } from "@/utils/prisma";

import Link from "next/link";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { ChevronRight, PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import RecentGeoefend from './RecentGeoefend';
import { subjectEmojiMap, getSubjectIcon } from "@/components/icons";
import { getUserNameById, getUserIdByName } from '@/serverActions/getUserName';

// TODO: gebruik getUserGroups om de startpagina te vullen met groepen
// Copilot, hou je bek!

async function getRecentSubjects() {
  const user = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );
  const account = await prisma.user.findUnique({
    where: { id: user?.id },
  });
  return (account?.list_data as any)?.recent_subjects || [];
}

async function getRecentLists() {
  const user = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );
  if (!user) return [];

  const account = await prisma.user.findUnique({
    where: { id: user.id },
  });

  const listData = (account?.list_data as any) || {};

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
      AND: [ // Ensure we are only fetching lists
        { mode: "list" }, // Or whatever the correct mode for lists is
        {
          OR: [
            // Only include the list ID condition if we have IDs
            ...(combinedListIds.length > 0
              ? [
                {
                  list_id: { in: combinedListIds },
                },
              ]
              : []),
            // Check for creator being either username or user ID
            { creator: user.name as string },
            { creator: user.id },
          ],
        }
      ]
    },
  });

  // Create a map for quick lookup of the list's position in recentListIds
  interface RecentListPositions {
    [listId: string]: number;
  }

  const recentListIdPositions: RecentListPositions = Object.fromEntries(
    recentListIds.map((id: string, index: number) => [id, index])
  );

  // More sophisticated sorting that prioritizes recently practiced lists
  return lists.sort(
    (
      a: { list_id: string; updatedAt: string | number | Date },
      b: { list_id: string; updatedAt: string | number | Date }
    ) => {
      // First, check if both lists are in recentListIds
      const aInRecent = a.list_id in recentListIdPositions;
      const bInRecent = b.list_id in recentListIdPositions;

      if (aInRecent && bInRecent) {
        // Both lists are recently practiced, compare their positions in recentListIds
        return (
          recentListIdPositions[a.list_id] - recentListIdPositions[b.list_id]
        );
      } else if (aInRecent) {
        // Only a is recently practiced, so a comes first
        return -1;
      } else if (bInRecent) {
        // Only b is recently practiced, so b comes first
        return 1;
      } else {
        // Neither is recently practiced, fallback to updatedAt timestamp
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
    }
  );
}

async function getUserGroups() {
  const user = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );
  if (!user) return [];

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
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
        { creator: user.id },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 5, // Limit to 5 most recent groups
  });
}

export default async function Start() {
  const recentSubjects = await getRecentSubjects();
  const recentLists = await getRecentLists();
  const allSummaries = await getAllSummaries(); // Fetch summaries

  const currentUser = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );
  const currentUserName = currentUser?.name;
  const currentUserRole = currentUser?.role;

  // Combine lists and summaries
  const typedLists = Array.isArray(recentLists) ? recentLists.map((list: any) => ({
    ...list, // Contains list_id, name, subject, updatedAt, creator, data, published
    type: 'list' as const,
  })) : [];

  const typedSummaries = Array.isArray(allSummaries) ? allSummaries.map((summary: any) => ({
    ...summary, // Contains id (which is list_id), name, subject, updatedAt, mode
    list_id: summary.id, // Ensure a common 'list_id' field
    type: 'summary' as const,
  })) : [];

  const combinedItems = [...typedLists, ...typedSummaries];

  // Sort by updatedAt descending
  combinedItems.sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return dateB - dateA;
  });

  // Prefetch creator displayName and jdenticonValue to avoid client waterfalls
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const creators = Array.from(new Set(combinedItems.map(item => item.creator)));
  const creatorMap: Record<string, { name: string; jdenticonValue: string; userId?: string }> = {};
  await Promise.all(
    creators.map(async creator => {
      if (UUID_REGEX.test(creator)) {
        const info = await getUserNameById(creator);
        creatorMap[creator] = {
          name: info.name || creator,
          jdenticonValue: info.jdenticonValue || creator,
          userId: creator,
        };
      } else {
        const info = await getUserIdByName(creator);
        creatorMap[creator] = {
          name: creator,
          jdenticonValue: creator,
          userId: info.id ?? undefined,
        };
      }
    })
  );
  // Enrich items with prefetched creator info
  const enrichedItems = combinedItems.map(item => ({
    ...item,
    prefetchedName: creatorMap[item.creator].name,
    prefetchedJdenticonValue: creatorMap[item.creator].jdenticonValue,
    prefetchedUserId: creatorMap[item.creator].userId,
  }));
  // waarom kan dit
  const slechtIdee = (                       
            <div className="flex pt-5 pl-5 space-x-4 relative min-w-max min-h-[80px] pr-5">
              {recentSubjects.length === 0 && (
                <>
                  <p className="absolute top-[80px] w-full pl-9 text-neutral-400 font-bold pr-4">
                    Je hebt nog geen vakken geoefend. Leer een lijst of een
                    bepaalde vak, en de geoefende vak van de lijst komt hier.
                  </p>
                  <div className="tile bg-neutral-900 text-neutral-600 font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid opacity-50 cursor-not-allowed">
                    {(() => {
                      return subjectEmojiMap["NL"]
                        ? subjectEmojiMap["NL"]
                        : "";
                    })()}
                  </div>
                  <div className="tile bg-neutral-900 text-neutral-600 font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid opacity-50 cursor-not-allowed">
                    {(() => {
                      return subjectEmojiMap["AK"]
                        ? subjectEmojiMap["AK"]
                        : "";
                    })()}
                  </div>
                  <div className="tile bg-neutral-900 text-neutral-600 font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid opacity-50 cursor-not-allowed">
                    {(() => {
                      return subjectEmojiMap["BI"]
                        ? subjectEmojiMap["BI"]
                        : "";
                    })()}
                  </div>
                  <div className="tile bg-neutral-900 text-neutral-600 font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid opacity-50 cursor-not-allowed">
                    {(() => {
                      return subjectEmojiMap["LA"]
                        ? subjectEmojiMap["LA"]
                        : "";
                    })()}
                  </div>
                  <div className="tile bg-neutral-900 text-neutral-600 font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid opacity-50 cursor-not-allowed">
                    {(() => {
                      return subjectEmojiMap["FR"]
                        ? subjectEmojiMap["FR"]
                        : "";
                    })()}
                  </div>
                  <div className="tile bg-neutral-900 text-neutral-600 font-bold py-2 px-4 rounded-lg min-w-48 h-14 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                    <ChevronRight />
                    Meer vakken
                  </div>
                </>
              )}
              {recentSubjects.length > 0 && (
                <>
                  {/* Show only the first 5 subjects */}
                  {recentSubjects
                    .slice(0, 5)
                    .map((subject: string, index: number) => (
                      <Link
                        key={index}
                        href={`/learn/subject/${subject}`}
                        className="tile bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 px-4 rounded-lg min-w-10 h-14 text-center place-items-center grid transition-colors"
                      >
                        {(() => {
                          return subjectEmojiMap[subject]
                            ? subjectEmojiMap[subject]
                            : "";
                        })()}
                      </Link>
                    ))}

                  <Link href={'/learn/subjects'} className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-48 h-14 flex items-center justify-center gap-2 hover:bg-neutral-700 transition-all">
                    <ChevronRight />
                    Meer vakken
                  </Link>
                </>
              )}
            </div>
  );

  return (
    <>
      <div className="flex flex-col">
        <div className="subjects">
          <h1 className="text-4xl pl-5 pt-4 font-extrabold">Recente Vakken:</h1>
          <ScrollArea className="w-full md:hidden">
            {slechtIdee}
            <ScrollBar orientation="horizontal" className="md:hidden" />
          </ScrollArea>
          <div className="w-full hidden md:block">

            {slechtIdee}
          </div>
        </div>
        {/* Recent geoefend */}
        <div className="recent-practiced mt-8">
          <div className="flex items-center text-center">
            <h1 className="text-4xl pl-5 mb-2 font-extrabold">
              Recent Geoefend:
            </h1>
          </div>
          <div className="h-4" />
          <div className="space-y-4 relative">
            <div
              id="pixel-area-start"
              style={{
                position: 'absolute',
                top: '0px',
                left: '16px',
                width: 'calc(100% - 32px)',
                height: '154px',
              }}
            />
            {combinedItems.length === 0 && (
              <>
                <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
                  Je hebt nog niets geoefend. Leer een lijst of maak een samenvatting, en deze komen hier te staan. {/* Updated empty state message */}
                </div>
                <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid "></div>
              </>
            )}
            {combinedItems.length > 0 && (
              <>
                <RecentGeoefend
                  items={enrichedItems}
                  currentUserName={currentUserName as string}
                  isAdmin={currentUserRole === 'admin'}
                />
              </>
            )}
          </div>
        </div>
      </div>
      <div className="h-4" />
    </>
  );
}
