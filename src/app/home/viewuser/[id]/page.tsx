import { prisma } from "@/utils/prisma";
import * as jdenticon from "jdenticon";
import Tabs, { TabItem } from "@/components/Tabs";
import Image from "next/image";
import Link from "next/link";
import Button1 from "@/components/button/Button1";
import CreatorLink from "@/components/links/CreatorLink";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { PencilIcon } from "lucide-react";
import DeleteListButton from "@/components/learning/DeleteListButton";

import { getSubjectIcon, getSubjectName } from "@/components/icons";
import ConstructionImg from "@/components/constructionImg";
import Jdenticon from "@/components/Jdenticon";
import { Badge } from "@/components/ui/badge";
// Add an interface for list data structure
interface ListData {
  created_lists?: string[] | null;
  // Add other properties as needed
}

// Update PracticeList interface to include data for word count
interface PracticeList {
  list_id: string;
  name: string;
  subject: string;
  createdAt: Date;
  published: boolean;
  data: any[];
  creator: string;
}

interface PageProps {
  params: Promise<{
    id: string; // Changed from 'name' to 'id' to handle both UUIDs and names
    selectedTab?: string;
  }>;
}

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: PageProps) {
  // Await the Promise to get the actual params
  const { id, selectedTab } = await params;

  // Get current user for checking if they own the lists
  const currentUser = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );
  const currentUserName = currentUser?.name;

  // Check if the id parameter is a UUID or a username
  let user;
  if (UUID_REGEX.test(id)) {
    // If it's a UUID, find user by ID
    user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
  } else {
    // If it's not a UUID, treat it as a username (for backward compatibility)
    user = await prisma.user.findFirst({
      where: {
        name: id,
      },
    });
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 space-y-6">
        <h1 className="text-5xl font-bold text-red-600">☹️ Oeps!</h1>
        <p className="mt-2 text-2xl">De opgegeven gebruiker is niet gevonden</p>
        <Button1 text={"Terug naar leren"} redirectTo={"/home/start"} />
      </div>
    );
  }

  // Check if the current user is viewing their own profile
  const isOwnProfile = currentUser?.id === user.id;

  // Fetch lists created by this user (published for others, all for own profile)
  const rawLists = await prisma.practice.findMany({
    where: {
      creator: user.id as string,
      published: isOwnProfile ? undefined : true, // Show all if own profile, only published for others
      mode: "list"
    },
    orderBy: {
      createdAt: "desc", // Sort by newest first
    },
  });

  const summaries = await prisma.practice.findMany({
    where: {
      creator: user.id as string,
      published: isOwnProfile ? undefined : true, // Show all if own profile, only published for others
      mode: "summary"
    },
    orderBy: {
      createdAt: "desc"
    }
  })
  console.log(summaries)

  // Get user's groups data for the groups tab
  const userData = await prisma.user.findUnique({
    where: { id: user.id }
  });

  // Get IDs of groups the user is in
  const userOwnGroups = (userData?.ownGroups as string[]) || [];
  const userInGroups = (userData?.inGroups as string[]) || [];

  // Combine and deduplicate group IDs
  const allUserGroupIds = [...new Set([...userOwnGroups, ...userInGroups])];

  // Fetch all groups the user is a member of
  const userGroups = await prisma.group.findMany({
    where: {
      OR: [
        { groupId: { in: allUserGroupIds } },
        { creator: user.id }
      ]
    },
    orderBy: { updatedAt: 'desc' }
  });

  const createdLists: PracticeList[] = rawLists.map((list) => ({
    list_id: list.list_id as string,
    name: list.name as string,
    subject: list.subject as string,
    createdAt: list.createdAt as Date,
    published: list.published as boolean,
    creator: list.creator as string,
    data: Array.isArray(list.data) ? list.data : []
  }));

  // Generate Identicon SVG as fallback
  const svg = jdenticon.toSvg(user?.name || "default", 100);

  // Define tabs for this specific page
  const tabs: TabItem[] = [
    {
      id: "lists",
      label: "Gemaakte lijsten",
      content: (
        <div className="mt-4">
          {createdLists.length > 0 ? (
            <div className="space-y-4">
              {createdLists.map((list) => (
                <div key={list.list_id}>
                  <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                    <Link
                      href={`/learn/viewlist/${list.list_id}`}
                      className="flex-1 flex items-center"
                    >
                      <div className="flex items-center">
                        {list.subject && (
                          <Image
                            src={getSubjectIcon(list.subject) || ""}
                            alt={`${getSubjectName(list.subject)} icon`}
                            width={24}
                            height={24}
                            className="mr-2"
                          />
                        )}
                        <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                          {list.name}
                        </span>
                        {!list.published && (
                          <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                            Concept
                          </span>
                        )}
                      </div>
                      <div className="flex-grow"></div>
                      <div className="flex items-center pr-2">
                        {Array.isArray(list.data) && list.data.length === 1
                          ? "1 woord"
                          : `${Array.isArray(list.data) ? list.data.length : 0
                          } woorden`}
                      </div>
                    </Link>

                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                      <CreatorLink creator={list.creator} />
                    </div>

                    {/* Action buttons for list owner */}
                    {(list.creator === currentUserName || currentUser?.role === "admin") && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/learn/editlist/${list.list_id}`}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                          title="Lijst bewerken"
                        >
                          <PencilIcon className="h-5 w-5 text-white" />
                        </Link>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                          <DeleteListButton
                            listId={list.list_id}
                            isCreator={list.creator === currentUserName || currentUser?.role === "admin"}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
              Geen lijsten gevonden
            </div>
          )}
        </div>
      ),
    },
    {
      id: "summaries",
      label: "Samenvattingen",
      content: (
        <div className="mt-4">
          {summaries.length > 0 ? (
            <div className="space-y-4">
              {summaries.map((summary) => (
                <div key={summary.list_id}>
                  <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer mb-4">
                    <Link
                      href={`/learn/summary/${summary.list_id}`}
                      className="flex-1 flex items-center"
                    >
                      <div className="flex items-center">
                        {summary.subject && (
                          <Image
                            src={getSubjectIcon(summary.subject) || ""}
                            alt={`${getSubjectName(summary.subject)} icoon`}
                            width={24}
                            height={24}
                            className="mr-2"
                          />
                        )}
                        <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                          {summary.name}
                        </span>
                        {!summary.published && (
                          <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                            Concept
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                      <CreatorLink creator={summary.creator} />
                    </div>

                    {/* Action buttons for summary owner */}
                    {(summary.creator === currentUserName || currentUser?.role === "admin") && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/learn/editsummary/${summary.list_id}`}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                          title="Samenvatting bewerken"
                        >
                          <PencilIcon className="h-5 w-5 text-white" />
                        </Link>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                          <DeleteListButton
                            listId={summary.list_id}
                            isCreator={summary.creator === currentUserName || currentUser?.role === "admin"}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
              Geen samenvattingen gevonden
            </div>
          )}
        </div>
      )
    },
    {
      id: "groups",
      label: "Groepen",
      content: (
        <div className="mt-4">
          {userGroups.length === 0 ? (
            <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
              {isOwnProfile ? "Je bent nog geen lid van een groep" : "Gebruiker is niet in een groep"}
            </div>
          ) : (
            <div className="space-y-4">
              {userGroups.map((group) => (
                <div key={group.groupId}>
                  <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                    <Link href={`/learn/group/${group.groupId}`} className="flex-1 flex items-center">
                      <div className="flex items-center gap-3">
                        <Jdenticon value={group.name} size={40} />
                        <span className="text-lg whitespace-normal break-words max-w-[40ch] flex flex-row">
                          {group.name}
                          <div className="flex gap-2 mt-1 pl-2">
                            {group.creator === user.id && (
                              <Badge className="bg-amber-600/20 text-amber-500 border border-amber-600/50 text-xs">
                                Eigenaar
                              </Badge>
                            )}
                            {Array.isArray(group.admins) && group.admins.includes(user.id) && group.creator !== user.id && (
                              <Badge className="bg-blue-600/20 text-blue-500 border border-blue-600/50 text-xs">
                                Beheerder
                              </Badge>
                            )}
                          </div>
                        </span>
                      </div>
                      <div className="flex-grow"></div>
                      <div className="flex items-center pr-2">
                        <span className="text-sm text-neutral-400">
                          {Array.isArray(group.members) ? group.members.length : 0} {Array.isArray(group.members) && group.members.length === 1 ? "lid" : "leden"} •
                          {Array.isArray(group.listsAdded) ? group.listsAdded.length : 0} {Array.isArray(group.listsAdded) && group.listsAdded.length === 1 ? "lijst" : "lijsten"}
                        </span>
                      </div>
                    </Link>

                    {group.description && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[150px] text-center">
                        <p className="text-sm text-neutral-400 line-clamp-1">{group.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "achievements",
      label: "Prestaties",
      content: (
        <div>
          {/* Achievements content will go here */}
          <ConstructionImg />
        </div>
      ),
    },
  ];

  return (
    <div className="pt-4">
      <div className="space-x-5 flex flex-row items-center pl-2">
        {user?.image ? (
          <Image
            src={user.image}
            alt={`${user.name}'s Avatar`}
            width={100}
            height={100}
            className="rounded-full"
          />
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: svg,
            }}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              overflow: "hidden",
            }}
          />
        )}
        <h1 className="text-2xl font-bold">{user?.name}</h1>
      </div>
      <div className="h-4" />
      <div className="pl-4">
        <Tabs
          tabs={tabs}
          defaultActiveTab={selectedTab || "lists"}
          withRoutes={true}
          baseRoute={`/home/viewuser/${id}`} // Use params.id (which can be UUID or name)
        />
      </div>
      <div className="h-4" />
    </div>
  );
}
