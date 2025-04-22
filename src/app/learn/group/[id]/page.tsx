"use server"
import Jdenticon from "@/components/Jdenticon";
import { prisma } from "@/utils/prisma";
import Tabs, { TabItem } from "@/components/Tabs";
import Image from "next/image";
import construction from '@/app/img/construction.gif';
import Link from "next/link";
import { cookies } from "next/headers";
import { PlusIcon, PencilIcon } from "lucide-react";
import { getUserFromSession } from "@/utils/auth/auth";
import { Badge } from "@/components/ui/badge";
import CreatorLink from "@/components/links/CreatorLink";
import { getGroupLists } from "@/serverActions/groupActions";
import { Button } from "@/components/ui/button";
import { Trash, AlertTriangle } from "lucide-react";
import SettingsForm from "@/components/groups/SettingsForm";
import DeleteGroupButton from "@/components/groups/DeleteGroupButton";
import AdminToggleButton from "@/components/groups/AdminToggleButton";
import JoinGroupButton from "@/components/groups/JoinGroupButton";
import MemberApprovalButton from "@/components/groups/MemberApprovalButton";
import RemoveMemberButton from "@/components/groups/RemoveMemberButton";

// Subject images
import nsk_img from '@/app/img/nask.svg'
import math_img from '@/app/img/math.svg'
import eng_img from '@/app/img/english.svg'
import fr_img from '@/app/img/baguette.svg'
import de_img from '@/app/img/pretzel.svg'
import nl_img from '@/app/img/nl.svg'
import gs_img from '@/app/img/history.svg'
import bi_img from '@/app/img/bio.svg'
import ak_img from '@/app/img/geography.svg'
import DeleteListButton from "@/components/learning/DeleteListButton";
import AddListDialog from "@/components/groups/AddListDialog";
import Button1 from "@/components/button/Button1";

// Improved function to fetch user details for members
async function getGroupMembersDetails(memberIds: string[]) {
  // Create a memberMap regardless of input
  const memberMap = new Map();

  if (!memberIds.length) {
    // Return consistent structure even when empty
    return { members: [], memberMap };
  }

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

  // Create a lookup map for quick access
  members.forEach(member => {
    memberMap.set(member.id, member);
    if (member.name) memberMap.set(member.name, member);
  });

  return { members, memberMap };
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

  // Get current user with complete information
  const currentUser = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

  // Track both ID and name to handle different storage formats
  const currentUserId = currentUser?.id || '';
  const currentUserName = currentUser?.name || '';

  // Check if user is creator or member of the group (using ID comparison)
  const members = groupData?.members as string[] || [];
  const isCreator = groupData?.creator === currentUserId;
  const isAdmin = Array.isArray(groupData?.admins) ?
    groupData.admins.includes(currentUserId) : false;

  // Check membership based on either ID or name to handle different storage formats
  const isMember = members.includes(currentUserId) ||
    members.includes(currentUserName) ||
    isCreator;

  // Check if user can add lists based on group permissions
  const canAddLists = isCreator || isAdmin || groupData?.everyoneCanAddLists === true;

  // Get lists that are in the group
  const groupLists = await getGroupLists(id);

  // Get members details for display with improved approach
  const memberIds = groupData?.members as string[] || [];
  const pendingMembers = groupData?.toBeApproved as string[] || [];
  const { members: membersDetails, memberMap } = await getGroupMembersDetails([...memberIds, ...pendingMembers]);

  // Function to get a user-friendly display name
  const getDisplayName = (userId: string) => {
    const member = memberMap.get(userId);
    return member?.name || "Gebruiker";  // Default to "User" instead of showing UUID
  };

  // Check for pending membership
  const isPendingApproval = pendingMembers.includes(currentUserId) || pendingMembers.includes(currentUserName);

  // Define tabs for this page
  const tabs: TabItem[] = [
    {
      id: "lists",
      label: "Lijsten",
      content: (
        <div className="mt-4 p-4">

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
            <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 rounded-lg h-20 text-center place-items-center grid">
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
                  <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 rounded-lg min-h-20 h-auto flex items-center justify-between">
                    <Link href={`/learn/viewlist/${list.list_id}`} className="flex-1 flex items-center">
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
          {/* Show pending members section for admins/creators */}
          {(isAdmin || isCreator) && pendingMembers.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">Goedkeuring nodig ({pendingMembers.length})</h2>
              <div className="space-y-3">
                {pendingMembers.map((memberId) => {
                  const displayName = getDisplayName(memberId);

                  return (
                    <div key={`pending-${memberId}`} className="p-4 bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <Jdenticon value={displayName} size={40} />
                        <div className="ml-4">
                          <div className="font-medium flex items-center">
                            {displayName}
                            <Badge className="ml-3 bg-orange-600/20 text-orange-500 border border-orange-600/50">
                              Wachtend op goedkeuring
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <MemberApprovalButton
                          groupId={id}
                          memberId={memberId}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold mb-3">Leden ({memberIds.length})</h2>

          {memberIds.length === 0 ? (
            <div className="bg-neutral-800 text-neutral-400 text-center p-6 rounded-lg">
              Deze groep heeft nog geen leden.
            </div>
          ) : (
            <div className="space-y-3">
              {memberIds.map((memberId) => {
                const displayName = getDisplayName(memberId);

                // Check roles
                const isGroupAdmin = Array.isArray(groupData?.admins) ?
                  groupData.admins.includes(memberId) : false;
                const isGroupCreator = groupData?.creator === memberId;

                return (
                  <div key={memberId} className="p-4 bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg flex items-center justify-between">
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    // Add a settings tab that's only visible to admins and creators
    ...(isAdmin || isCreator ? [{
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

          {/* Danger zone (only visible to creator) */}
          {isCreator && (
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

  return (
    <div className="flex flex-col p-4">
      <section className="flex flex-col">
        <div className="flex flex-row space-x-2 items-center justify-between">
          <div className="flex space-x-2">
            <Jdenticon value={groupData?.name as string} size={70} />
            <div className="flex flex-col">
              <h1 className="font-extrabold text-4xl">{groupData?.name}</h1>
              <p>{groupData?.description}</p>
            </div>
          </div>

          {/* Add join button for non-members or show pending status */}
          {currentUser && !isMember && (
            isPendingApproval ? (
              <div className="text-orange-500 bg-orange-500/10 px-4 py-2 rounded-md border border-orange-500/30 font-medium">
                Wachtend op goedkeuring
              </div>
            ) : (
              <JoinGroupButton
                groupId={id}
                requiresApproval={groupData?.requiresApproval === true}
              />
            )
          )}
        </div>

      </section>
      <hr className="flex-grow border-neutral-600 mt-2" />

      {/* Add tabs component */}
      <div className="mt-4">
        <Tabs
          tabs={tabs}
          defaultActiveTab={tab || "lists"}
          withRoutes={true}
          baseRoute={`/learn/group/${id}`}
        />
      </div>
    </div>
  )
}
