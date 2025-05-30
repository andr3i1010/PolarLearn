import { prisma } from "@/utils/prisma";
import Image from "next/image";
import PlusBtn from "@/components/button/plus";
import Link from "next/link";
import CreatorLink from "@/components/links/CreatorLink";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { ChevronRight, PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DeleteListButton from "@/components/learning/DeleteListButton";
import { subjectEmojiMap, getSubjectIcon } from "@/components/icons";

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

  // Get current user name once to use in comparisons
  const currentUser = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );
  const currentUserName = currentUser?.name;
  const currentUserRole = currentUser?.role;

  // Extract the subject emoji map for reuse

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
                    Je hebt nog geen vakken geoefend. Leer een lijst van een
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
        <div className="recent-lists mt-8">
          <div className="flex items-center text-center">
            <h1 className="text-4xl pl-5 pt-4 mb-2 font-extrabold">
              Recente Lijsten:
            </h1>
            <div className="ml-auto mr-5">
              <PlusBtn
                redir="/learn/createlist"
                title={"Nieuwe lijst maken"}
              />
            </div>
          </div>
          <div className="h-4" />
          <div className="space-y-4">
            {recentLists.length == 0 && (
              <>
                <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
                  Je hebt nog geen lijsten geoefend. Leer een lijst, en de
                  geoefende lijst komt hier.
                </div>
                <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid "></div>
              </>
            )}
            {recentLists.length > 0 && (
              <>
                {recentLists.map((list: any, index: number) => (
                  <div key={list.list_id}>
                    <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                      <Link
                        href={`/learn/viewlist/${list.list_id}`}
                        className="flex-1 flex items-center"
                        key={index}
                      >
                        <div className="flex items-center">
                          {list.subject && (
                            <Image
                              src={getSubjectIcon(list.subject)}
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
                            : `${Array.isArray(list.data) ? list.data.length : 0
                            } woorden`}
                        </div>
                      </Link>

                      {list.creator && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                          <CreatorLink creator={list.creator} />
                        </div>
                      )}

                      {/* Action buttons for list owner */}
                      <div className="flex items-center gap-2">
                        {(list.creator === currentUserName || list.creator === currentUser?.id || currentUserRole === "admin") && (
                          <Link
                            href={`/learn/editlist/${list.list_id}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                            title="Lijst bewerken"
                          >
                            <PencilIcon className="h-5 w-5 text-white" />
                          </Link>
                        )}
                        {(list.creator === currentUserName || list.creator === currentUser?.id || currentUserRole === "admin") && (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                            <DeleteListButton
                              listId={list.list_id}
                              isCreator={true}
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
