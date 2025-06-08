import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import Button1 from "@/components/button/Button1";
import ListsTabContent from "./ListsTabContent";
import SummariesTabContent from "./SummariesTabContent";
import GroupsTabContent from "./GroupsTabContent";
import AchievementsTabContent from "./AchievementsTabContent";

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    id: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  // Get current user for checking permissions
  const currentUser = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );

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

  // Determine which tab content to render (default to "lists")
  const selectedTab = tab || "lists";

  // Fetch data based on the selected tab to optimize performance
  switch (selectedTab) {
    case "lists": {
      // Fetch lists created by this user
      const rawLists = await prisma.practice.findMany({
        where: {
          creator: user.id as string,
          published: isOwnProfile ? undefined : true,
          mode: "list"
        },
        orderBy: {
          createdAt: "desc",
        },
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

      return (
        <ListsTabContent
          lists={createdLists}
          currentUserName={currentUser?.name || null}
          currentUserRole={currentUser?.role}
        />
      );
    }

    case "summaries": {
      // Fetch summaries created by this user
      const summaries = await prisma.practice.findMany({
        where: {
          creator: user.id as string,
          published: isOwnProfile ? undefined : true,
          mode: "summary"
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      const summaryList: PracticeList[] = summaries.map((summary) => ({
        list_id: summary.list_id as string,
        name: summary.name as string,
        subject: summary.subject as string,
        createdAt: summary.createdAt as Date,
        published: summary.published as boolean,
        creator: summary.creator as string,
        data: Array.isArray(summary.data) ? summary.data : []
      }));

      return (
        <SummariesTabContent
          summaries={summaryList}
          currentUserName={currentUser?.name || null}
          currentUserRole={currentUser?.role}
        />
      );
    }

    case "groups": {
      // Get user's groups data
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

      return (
        <GroupsTabContent
          groups={userGroups.map(group => ({
            groupId: group.groupId,
            name: group.name,
            description: group.description,
            members: group.members,
            listsAdded: group.listsAdded,
            creator: group.creator,
            admins: group.admins
          }))}
          user={{
            id: user.id,
            name: user.name
          }}
          isOwnProfile={isOwnProfile}
        />
      );
    }

    case "achievements": {
      return <AchievementsTabContent userId={user.id} isOwnProfile={isOwnProfile} />;
    }

    default: {
      // Default to lists tab
      const rawLists = await prisma.practice.findMany({
        where: {
          creator: user.id as string,
          published: isOwnProfile ? undefined : true,
          mode: "list"
        },
        orderBy: {
          createdAt: "desc",
        },
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

      return (
        <ListsTabContent
          lists={createdLists}
          currentUserName={currentUser?.name || null}
          currentUserRole={currentUser?.role}
        />
      );
    }
  }
}
