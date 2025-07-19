import Jdenticon from "@/components/Jdenticon";
import { prisma } from "@/utils/prisma";
import { TabItem } from "@/components/Tabs";
import Link from "next/link";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth/auth";
import { Badge } from "@/components/ui/badge";
import { getGroupLists, getPendingApprovals, getAvailableLists } from "@/serverActions/groupActions";
import { AlertTriangle } from "lucide-react";
import SettingsForm from "@/components/groups/SettingsForm";
import DeleteGroupButton from "@/components/groups/DeleteGroupButton";
import AdminToggleButton from "@/components/groups/AdminToggleButton";
import Button1 from "@/components/button/Button1";
import PendingApprovals from "@/components/groups/PendingApprovals";
import RemoveMemberButton from "@/components/groups/RemoveMemberButton";
import GroupPictureManager from "@/components/groups/GroupPictureManager";
import GroepLijsten from "@/app/learn/group/[id]/GroepLijsten";
import { Metadata } from "next";
import { sendNotificationToUser } from '@/utils/notifications/sendNotification';
import { getUserNameById } from '@/serverActions/getUserName';

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Add this new function to fetch user details for members
async function getGroupMembersDetails(memberIds: string[]) {
  if (!memberIds.length) return [];

  // Fetch user details for all members
  const members = await prisma.user.findMany({
    where: {
      OR: [
        { id: { in: memberIds } },
        { name: { in: memberIds } }
      ]
    },
    select: {
      id: true,
      name: true,
      image: true
    }
  });

  return members;
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; tab?: string }>;
}) {
  const { id, tab } = await params;

  const groupData = await prisma.group.findFirst({
    where: {
      groupId: id
    }
  });

  // Handle group not found
  if (!groupData) {
    return (
      <div className="flex flex-col p-4 items-center justify-center text-center h-[calc(100vh-200px)]">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Groep niet gevonden</h1>
        <p className="text-neutral-400 mb-6">
          De groep die je zoekt bestaat niet of is mogelijk verwijderd.
        </p>
        <Link href="/learn/groups">
          <Button1 text="Terug naar groepen" />
        </Link>
      </div>
    );
  }

  // Get current user with complete information
  const currentUser = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);
  if (!currentUser) {
    return <div className="text-center text-neutral-400">Je moet ingelogd zijn om deze pagina te bekijken.</div>;
  }

  // Track both ID and name to handle different storage formats
  const currentUserId = currentUser.id;
  const currentUserName = currentUser.name;
  if (!currentUserId || !currentUserName) {
    return <div className="text-center text-neutral-400">Je moet ingelogd zijn om deze pagina te bekijken.</div>;
  }

  // Automatically elect a new owner if the current owner no longer exists
  let isNewOwner = false;
  const ownerExists = await prisma.user.findUnique({ where: { id: groupData.creator } });
  if (!ownerExists && Array.isArray(groupData.members) && groupData.members.length > 0) {
    // Fetch existing member details
    const aliveMembers = await getGroupMembersDetails(groupData.members as string[]);
    if (aliveMembers.length > 0) {
      const newOwnerId = aliveMembers[Math.floor(Math.random() * aliveMembers.length)].id;
      // Update group creator
      await prisma.group.update({ where: { groupId: id }, data: { creator: newOwnerId } });
      groupData.creator = newOwnerId;
      // Send notification to the newly elected owner
      await sendNotificationToUser(
        newOwnerId,
        `Sindsdat de eigenaar van "${groupData.name}" zijn/haar account heeft verwijdert, ben je de nieuwe eigenaar van deze groep!`,
        'Award'
      );
      if (currentUserId === newOwnerId) {
        isNewOwner = true;
      }
    }
  }

  // Check if user is creator or member of the group (using ID or name comparison)
  const members = groupData?.members as string[] || [];
  const isCreator = groupData?.creator === currentUserId || groupData?.creator === currentUserName;
  const isAdmin = Array.isArray(groupData?.admins) ?
    groupData.admins.includes(currentUserId) : false;
  const isPlatformAdmin = currentUser.role === 'admin';

  // Check membership based on either ID or name to handle different storage formats
  const isMember = members.includes(currentUserId) ||
    members.includes(currentUserName) ||
    isCreator;

  // Check if user can add lists based on group permissions
  const canAddLists = isCreator || isAdmin || groupData?.everyoneCanAddLists === true;

  // Get lists that are in the group
  const groupLists = await getGroupLists(id);
  // Prefetch creators for group lists
  const listCreators = Array.from(new Set(groupLists.map(l => l.creator)));
  const creatorMap: Record<string, { name: string; jdenticonValue: string }> = {};
  await Promise.all(listCreators.map(async creator => {
    if (UUID_REGEX.test(creator)) {
      const info = await getUserNameById(creator);
      creatorMap[creator] = { name: info.name || creator, jdenticonValue: info.jdenticonValue || creator };
    } else {
      creatorMap[creator] = { name: creator, jdenticonValue: creator };
    }
  }));
  // Enrich groupLists with prefetched data
  const enrichedGroupLists = groupLists.map(item => ({
    ...item,
    prefetchedName: creatorMap[item.creator]?.name,
    prefetchedJdenticonValue: creatorMap[item.creator]?.jdenticonValue,
  }));

  // Get available lists for AddListDialog
  const availableListsResult = await getAvailableLists(id);
  const availableLists = availableListsResult.success ? availableListsResult.lists : [];

  // Get members details for display
  const memberIds = groupData?.members as string[] || [];
  const membersDetails = await getGroupMembersDetails(memberIds);

  // Fetch pending approval requests
  let pendingRequests = [];
  if (isAdmin || isCreator || isPlatformAdmin) {
    const pendingResult = await getPendingApprovals(id);
    if (pendingResult.success && pendingResult.pendingApprovals) {
      pendingRequests = pendingResult.pendingApprovals;
    }
  }

  // Define tabs for this page
  const tabs: TabItem[] = [
    {
      id: "lists",
      label: "Lijsten",
      content: (
        <GroepLijsten
          lists={enrichedGroupLists}
          groupId={id}
          isMember={isMember}
          canAddLists={canAddLists}
          isCreator={isCreator}
          isAdmin={isAdmin}
          isPlatformAdmin={isPlatformAdmin}
          currentUserName={currentUserName}
          availableLists={availableLists}
        />
      ),
    },
    {
      id: "members",
      label: "Leden",
      content: (
        <div className="mt-4 p-4">
          {/* Approval Requests Section - Only visible to admins */}
          {(isAdmin || isCreator || isPlatformAdmin) && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                Openstaande verzoeken
                {pendingRequests.length > 0 && (
                  <Badge className="ml-2 bg-amber-600 text-white" variant="secondary">
                    {pendingRequests.length}
                  </Badge>
                )}
              </h2>

              {pendingRequests.length > 0 ? (
                <PendingApprovals groupId={id} />
              ) : (
                <div className="bg-neutral-800 text-neutral-400 p-4 rounded-lg">
                  Er zijn geen openstaande verzoeken.
                </div>
              )}

              <hr className="my-6 border-neutral-600" />
            </div>
          )}

          {/* Existing Members Section */}
          <h2 className="text-xl font-bold mb-4">Groepsleden</h2>
          {membersDetails.length === 0 ? (
            <div className="bg-neutral-800 text-neutral-400 text-center p-6 rounded-lg">
              Deze groep heeft nog geen leden.
            </div>
          ) : (
            <div className="space-y-3">
              {membersDetails.map((member) => {
                const memberId = member.id;
                const displayName = member.name;
                const isGroupAdmin = Array.isArray(groupData?.admins)
                  ? groupData.admins.includes(memberId)
                  : false;
                const isGroupCreator = groupData?.creator === memberId;
                return (
                  <Link
                    href={`/home/viewuser/${memberId}`}
                    key={memberId}
                    className="p-4 bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={`Profielfoto van ${displayName}`}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <Jdenticon value={displayName as string} size={40} />
                      )}
                      <div className="ml-4">
                        <div className="font-medium flex items-center">
                          {displayName}
                          <div className="flex gap-2 ml-3">
                            {isGroupCreator && (
                              <Badge className="bg-amber-600/20 text-amber-500 border border-amber-600/50">
                                Eigenaar
                              </Badge>
                            )}
                            {isGroupAdmin && !isGroupCreator && (
                              <Badge className="bg-blue-600/20 text-blue-500 border border-blue-600/50">
                                Beheerder
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(isCreator || (isAdmin && !isGroupCreator)) && (
                      <div className="flex gap-2">
                        {!isGroupCreator && (
                          <>
                            {isCreator && (
                              <AdminToggleButton
                                groupId={id}
                                memberId={memberId}
                                isAdmin={isGroupAdmin}
                              />
                            )}
                            <span className="text-neutral-600">|</span>
                            <RemoveMemberButton
                              groupId={id}
                              memberId={memberId}
                              memberName={displayName as string}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    ...(isAdmin || isCreator || currentUser?.role === "admin" ? [{
      id: "settings",
      label: "Instellingen",
      content: (
        <div className="mt-4 p-4">
          <h2 className="text-2xl font-bold mb-6">Groepsinstellingen</h2>

          {/* Group Picture Manager */}
          <GroupPictureManager
            groupId={id}
            currentImage={groupData?.image}
            canEdit={isAdmin || isCreator}
          />

          {/* Settings form */}
          <div className="mb-8 bg-neutral-800 rounded-lg p-6">
            <SettingsForm
              groupId={id}
              initialName={groupData?.name || ''}
              initialDescription={groupData?.description || ''}
              initialEveryoneCanAddLists={groupData?.everyoneCanAddLists === true}
              isCreator={isCreator}
            />
          </div>

          {/* Danger zone (only visible to creator or admin) */}
          {(isCreator || currentUser?.role === "admin") && (
            <div className="mt-8 border border-red-500/20 rounded-lg p-6">
              <div className="flex items-start">
                <AlertTriangle className="text-red-500 mr-4 h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-red-500">Gevaarlijke zone</h3>
                  <p className="text-neutral-400 mt-2 mb-4">
                    Als je deze groep verwijdert, kunnen de leden niet langer toegang krijgen tot de gedeelde lijsten.
                    Deze actie kan niet ongedaan worden gemaakt.
                  </p>

                  <DeleteGroupButton groupId={id} />
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    }] : []),
  ];

  // Render selected tab content
  const currentTabId = tab || 'lists';
  // Access control for restricted groups
  if (groupData.requiresApproval && !isMember) {
    return (
      <div className="mt-8 text-center text-neutral-400 bg-neutral-800 p-8 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Toegang beperkt</h2>
        <p>De inhoud van deze groep is alleen zichtbaar voor leden.</p>
        <p>Je verzoek om lid te worden is in behandeling of je moet nog een verzoek indienen.</p>
      </div>
    );
  }
  const selectedTab = tabs.find((t) => t.id === currentTabId);
  return <div className="mt-4 p-4">{selectedTab?.content}</div>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; tab?: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const groupData = await prisma.group.findFirst({
      where: {
        groupId: id
      }
    });

    if (!groupData) {
      return {
        title: "PolarLearn | Groep niet gevonden",
        description: "De gevraagde groep kon niet worden gevonden.",
      };
    }

    // Clean the description for metadata (limit length for SEO)
    const cleanDescription = groupData.description
      ? groupData.description.trim().substring(0, 160)
      : "Bekijk deze groep op PolarLearn.";

    return {
      title: `PolarLearn Groepen | ${groupData.name}`,
      description: cleanDescription,
    };
  } catch (error) {
    return {
      title: "PolarLearn | Groep",
      description: "Een onbekende fout is opgetreden bij het ophalen van de groepsgegevens.",
    };
  }
}
