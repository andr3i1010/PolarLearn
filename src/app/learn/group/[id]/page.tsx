"use server"
import Jdenticon from "@/components/Jdenticon";
import { prisma } from "@/utils/prisma";
import Tabs, { TabItem } from "@/components/Tabs";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { PlusIcon, PencilIcon } from "lucide-react";
import { getUserFromSession } from "@/utils/auth/auth";
import { Badge } from "@/components/ui/badge";
import CreatorLink from "@/components/links/CreatorLink";
import { getGroupLists, getPendingApprovals } from "@/serverActions/groupActions";
import { AlertTriangle } from "lucide-react";
import SettingsForm from "@/components/groups/SettingsForm";
import DeleteGroupButton from "@/components/groups/DeleteGroupButton";
import AdminToggleButton from "@/components/groups/AdminToggleButton";

import { getSubjectIcon } from "@/components/icons"
import DeleteListButton from "@/components/learning/DeleteListButton";
import AddListDialog from "@/components/groups/AddListDialog";
import Button1 from "@/components/button/Button1";
import PendingApprovals from "@/components/groups/PendingApprovals";
import RemoveMemberButton from "@/components/groups/RemoveMemberButton";
import { Metadata } from "next";

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
        <div className="px-4">

          <div className="flex justify-between items-center mb-4">
            <div className="flex-grow" />
            {isMember && canAddLists && (
              <AddListDialog groupId={id}>
                <Button1
                  text="Lijst toevoegen"
                  icon={<PlusIcon size={14} />}
                />
              </AddListDialog>
            )}
          </div>

          {groupLists.length === 0 ? (
            <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
              {isMember
                ? canAddLists
                  ? "Deze groep heeft nog geen lijsten. Voeg een lijst toe om te beginnen."
                  : "Deze groep heeft nog geen lijsten. Vraag een beheerder om lijsten toe te voegen."
                : "Deze groep heeft nog geen lijsten."}
            </div>
          ) : (
            <div className="space-y-4">
              {groupLists.map((list) => (
                <div key={list.list_id}>
                  <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                    <Link href={`${list.mode === "list" ? `/learn/viewlist/${list.list_id}` : `/learn/summary/${list.list_id}`}`} className="flex-1 flex items-center">
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
                    </Link>

                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                      <CreatorLink creator={list.creator} />
                    </div>

                    {/* Action buttons for list owner or group creator */}
                    {(isCreator || list.creator === currentUserName) && (
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
                            isCreator={isCreator || list.creator === currentUserName}
                          />
                        </div>
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
          {memberIds.length === 0 ? (
            <div className="bg-neutral-800 text-neutral-400 text-center p-6 rounded-lg">
              Deze groep heeft nog geen leden.
            </div>
          ) : (
            <div className="space-y-3">
              {memberIds.map((memberId) => {
                // Find user details if available
                const memberDetails = membersDetails.find(m =>
                  m.id === memberId || m.name === memberId
                );
                const displayName = memberDetails?.name || memberId;

                // Check roles
                const isGroupAdmin = Array.isArray(groupData?.admins) ?
                  groupData.admins.includes(memberId) : false;
                const isGroupCreator = groupData?.creator === memberId;

                return (
                  <Link href={`/home/viewuser/${memberId}`} key={memberId} className="p-4 bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Jdenticon value={displayName} size={40} />
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

                    {/* Member management options for admins */}
                    {(isCreator || (isAdmin && !isGroupCreator)) && (
                      <div className="flex gap-2">
                        {!isGroupCreator && (
                          <>
                            {/* Only show admin toggle if the current user is the creator */}
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
                              memberName={displayName}
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
