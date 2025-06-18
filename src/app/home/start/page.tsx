import { prisma } from "@/utils/prisma";
import Image from "next/image";
import Link from "next/link";
import CreatorLink from "@/components/links/CreatorLink";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { ChevronRight, PencilIcon, Trash2 } from "lucide-react"; // Added Trash2
import { Badge } from "@/components/ui/badge";
import DeleteListButton from "@/components/learning/DeleteListButton";
import DeleteSummaryButton from "@/components/learning/DeleteSummaryButton"; // Added DeleteSummaryButton
import { subjectEmojiMap, getSubjectIcon } from "@/components/icons";
import { getAllSummaries } from "@/serverActions/summaryActions"; // Added import

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
                    Je hebt nog geen vakken geoefend. Leer een lijst of een
                    bepaalde vak, en de geoefende vak van de lijst komt hier.
                  </p>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>

                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>
                  <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"></div>
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
                        className="tile bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid transition-colors"
                      >
                        {(() => {
                          return subjectEmojiMap[subject]
                            ? subjectEmojiMap[subject]
                            : "";
                        })()}
                      </Link>
                    ))}

                  {recentSubjects.length >= 5 && (
                    <Link href={'/learn/subjects'} className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-48 h-14 flex items-center justify-center gap-2 hover:bg-neutral-700 transition-all">
                      <ChevronRight />
                      Meer vakken
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Combined "Recent Geoefend" section */}
        <div className="recent-practiced mt-8"> {/* Changed class name */}
          <div className="flex items-center text-center">
            <h1 className="text-4xl pl-5 pt-4 mb-2 font-extrabold">
              Recent Geoefend: {/* Changed heading */}
            </h1>
            <div className="ml-auto mr-5">
              {/* <PlusBtn /> */}
            </div>
          </div>
          <div className="h-4" />
          <div className="space-y-4">
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
                {combinedItems.map((item: any, index: number) => {
                  if (item.type === 'list') {
                    return (
                      <div key={item.list_id}>
                        <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                          <Link
                            href={`/learn/viewlist/${item.list_id}`}
                            className="flex-1 flex items-center"
                          >
                            <div className="flex items-center">
                              {item.subject && (
                                <Image
                                  src={getSubjectIcon(item.subject)}
                                  alt={`${item.subject} icon`}
                                  width={24}
                                  height={24}
                                  className="mr-2"
                                />
                              )}
                              <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                                {item.name}
                                {item.published === false && (
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
                              {Array.isArray(item.data) && item.data.length === 1
                                ? "1 woord"
                                : `${Array.isArray(item.data) ? item.data.length : 0
                                } woorden`}
                            </div>
                          </Link>

                          {item.creator && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                              <CreatorLink creator={item.creator} />
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {(item.creator === currentUserName || item.creator === currentUser?.id || currentUserRole === "admin") && (
                              <Link
                                href={`/learn/editlist/${item.list_id}`}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                                title="Lijst bewerken"
                              >
                                <PencilIcon className="h-5 w-5 text-white" />
                              </Link>
                            )}
                            {(item.creator === currentUserName || item.creator === currentUser?.id || currentUserRole === "admin") && (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                <DeleteListButton
                                  listId={item.list_id}
                                  isCreator={true}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'summary') {
                    return (
                      <div key={item.list_id} className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between">
                        <Link
                          href={`/learn/summary/${item.list_id}`} // Use item.list_id (mapped from summary.id)
                          className="flex-1 flex items-center"
                        >
                          <div className="flex items-center">
                            {item.subject && (
                              <Image
                                src={getSubjectIcon(item.subject)}
                                alt={`${item.subject} icon`}
                                width={24}
                                height={24}
                                className="mr-2"
                              />
                            )}
                            <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                              {item.name}
                              {item.published === false && (
                                <Badge
                                  variant="secondary"
                                  className="ml-2 bg-amber-600/20 text-amber-500 border border-amber-600/50 text-xs"
                                >
                                  Concept
                                </Badge>
                              )}
                            </span>
                          </div>
                        </Link>

                        {item.creator && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                            <CreatorLink creator={item.creator} />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/learn/editsummary/${item.list_id}`} // Use item.list_id
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                            title="Samenvatting bewerken"
                          >
                            <PencilIcon className="h-5 w-5 text-white" />
                          </Link>
                          {/* Add DeleteSummaryButton here */}
                          {(item.creator === currentUserName || item.creator === currentUser?.id || currentUserRole === "admin") && (
                            <DeleteSummaryButton summaryId={item.list_id} />
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="h-4" />
    </>
  );
}
