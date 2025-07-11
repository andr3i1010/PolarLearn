import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { PencilIcon } from "lucide-react";
import DeleteListButton from "@/components/learning/DeleteListButton";
import CreatorLink from "@/components/links/CreatorLink";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { getSubjectIcon, getSubjectName } from "@/components/icons";
import { prefetchCreatorInfo } from '@/utils/creator';
import { formatWordCount } from '@/utils/list';

import construction from '@/app/img/construction.gif';

export default async function SubjectTabPage({
  params,
}: {
  params: Promise<{ subject: string; tab?: string[] }>;
}) {
  const { subject, tab } = await params;
  const selectedTab = tab?.[0] || 'practiced-lists';

  // Get current user for checking ownership
  const currentUser = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );
  const currentUserName = currentUser?.name;
  const currentUserRole = currentUser?.role;

  // Get subject name and icon
  const subjectName = getSubjectName(subject);
  const subjectIcon = getSubjectIcon(subject);

  // Fetch published lists for this subject
  const lists = await prisma.practice.findMany({
    where: {
      subject: subject,
      published: true,
    },
    select: {
      list_id: true,
      name: true,
      creator: true,
      createdAt: true,
      data: true,
      subject: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get user's recent lists
  const user = currentUser;
  const account = user ? await prisma.user.findUnique({
    where: { id: user.id }
  }) : null;

  const listData = account?.list_data as any || {};
  const recentListIds = Array.isArray(listData.recent_lists)
    ? listData.recent_lists.filter(Boolean)
    : [];

  // Fetch user's practiced lists for this subject
  const practicedLists = recentListIds.length > 0
    ? await prisma.practice.findMany({
      where: {
        list_id: { in: recentListIds },
        subject: subject,
        published: true,
      },
      select: {
        list_id: true,
        name: true,
        creator: true,
        createdAt: true,
        data: true,
        subject: true,
      },
    })
    : [];

  // Create a map for quick lookup of list positions in recentListIds
  const recentListIdPositions = Object.fromEntries(
    recentListIds.map((id: any, index: any) => [id, index])
  );

  // Sort practiced lists according to when they were practiced (most recent first)
  const sortedPracticedLists = practicedLists.sort((a: { list_id: string | number; }, b: { list_id: string | number; }) => {
    return recentListIdPositions[a.list_id] - recentListIdPositions[b.list_id];
  });

  // Find lists created by current user for this subject
  const myLists = currentUserName ? lists.filter((list: { creator: any; }) => list.creator === currentUserName) : [];

  // Prefetch creator info for all lists to avoid CSR waterfall
  const allLists = [...lists, ...practicedLists];
  const creators = allLists.map(list => list.creator);
  const creatorMap = await prefetchCreatorInfo(creators);

  // Enrich lists with prefetched creator info
  const enrichedLists = lists.map(list => ({
    ...list,
    prefetchedName: creatorMap[list.creator]?.name,
    prefetchedJdenticonValue: creatorMap[list.creator]?.jdenticonValue,
  }));

  const enrichedPracticedLists = sortedPracticedLists.map(list => ({
    ...list,
    prefetchedName: creatorMap[list.creator]?.name,
    prefetchedJdenticonValue: creatorMap[list.creator]?.jdenticonValue,
  }));

  const enrichedMyLists = myLists.map(list => ({
    ...list,
    prefetchedName: creatorMap[list.creator]?.name,
    prefetchedJdenticonValue: creatorMap[list.creator]?.jdenticonValue,
  }));

  // Fetch forum posts for this subject
  const forumPosts = await prisma.forum.findMany({
    where: {
      subject: subject,
      type: "thread"
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      post_id: true,
      title: true,
      content: true,
      creator: true,
      createdAt: true,
      votes: true
    },
    take: 10
  }) || [];

  // Get reply counts for forum posts
  const replyCountMap: Record<string, number> = {};

  if (forumPosts.length > 0) {
    const postIds = forumPosts.map((post: { post_id: any; }) => post.post_id);
    const replyCounts = await prisma.forum.groupBy({
      by: ['post_id'],
      where: {
        post_id: { in: postIds },
        type: "reply"
      },
      _count: {
        post_id: true,
      }
    });

    replyCounts.forEach((item: { post_id: string | number; _count: { post_id: number; }; }) => {
      replyCountMap[item.post_id] = item._count.post_id;
    });
  }

  // Get user names for creators
  const creatorIds = forumPosts.map((post: { creator: any; }) => post.creator);
  const creators2 = creatorIds.length > 0 ?
    await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, name: true }
    }) : [];

  // Create a map of user IDs to names
  const creatorNameMap: Record<string, string> = {};
  creators2.forEach((user: { id: string; name: string | null; }) => {
    if (user.name) {
      creatorNameMap[user.id] = user.name;
    }
  });

  // Render content based on selected tab
  if (selectedTab === "practiced-lists") {
    return (
      <div className="mt-4 px-6">
        {enrichedPracticedLists.length > 0 ? (
          <div className="space-y-4">
            {enrichedPracticedLists.map((list) => (
              <div key={list.list_id}>
                <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                  <Link href={`/learn/viewlist/${list.list_id}`} className="flex-1 flex items-center">
                    <div className="flex items-center">
                      {subjectIcon && (
                        <Image
                          src={subjectIcon}
                          alt={`${subjectName} icon`}
                          width={24}
                          height={24}
                          className="mr-2"
                        />
                      )}
                      <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                        {list.name}
                      </span>
                    </div>
                    <div className="flex-grow"></div>
                    <div className="flex items-center pr-2">
                      {Array.isArray(list.data) && list.data.length === 1
                        ? "1 woord"
                        : `${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                    </div>
                  </Link>

                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-auto">
                    <CreatorLink
                      creator={list.creator}
                      prefetchedName={list.prefetchedName}
                      prefetchedJdenticonValue={list.prefetchedJdenticonValue}
                    />
                  </div>

                  {/* Action buttons for list owner or admin */}
                  {(list.creator === currentUserName || currentUserRole === "admin") && (
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
                          listId={String(list.list_id)}
                          isCreator={true}
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
            {currentUserName
              ? `Je hebt nog geen ${subjectName} lijsten geoefend`
              : 'Log in om je geoefende lijsten te zien'}
          </div>
        )}
      </div>
    );
  }

  if (selectedTab === "all-lists") {
    return (
      <div className="mt-4 px-6">
        {enrichedLists.length > 0 ? (
          <div className="space-y-4">
            {enrichedLists.map((list) => (
              <div key={list.list_id}>
                <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                  <Link href={`/learn/viewlist/${list.list_id}`} className="flex-1 flex items-center">
                    <div className="flex items-center">
                      {subjectIcon && (
                        <Image
                          src={subjectIcon}
                          alt={`${subjectName} icon`}
                          width={24}
                          height={24}
                          className="mr-2"
                        />
                      )}
                      <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                        {list.name}
                      </span>
                    </div>
                    <div className="flex-grow"></div>
                    <div className="flex items-center pr-2">
                      {Array.isArray(list.data) && list.data.length === 1
                        ? "1 woord"
                        : `${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                    </div>
                  </Link>

                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-auto">
                    <CreatorLink
                      creator={list.creator}
                      prefetchedName={list.prefetchedName}
                      prefetchedJdenticonValue={list.prefetchedJdenticonValue}
                    />
                  </div>

                  {/* Action buttons for list owner or admin */}
                  {(list.creator === currentUserName || currentUserRole === "admin") && (
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
                          listId={String(list.list_id)}
                          isCreator={true}
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
            Er zijn nog geen lijsten voor {subjectName}
          </div>
        )}
      </div>
    );
  }

  if (selectedTab === "my-lists") {
    return (
      <div className="mt-4 px-6">
        {enrichedMyLists.length > 0 ? (
          <div className="space-y-4">
            {enrichedMyLists.map((list) => (
              <div key={list.list_id}>
                <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                  <Link href={`/learn/viewlist/${list.list_id}`} className="flex-1 flex items-center">
                    <div className="flex items-center">
                      {subjectIcon && (
                        <Image
                          src={subjectIcon}
                          alt={`${subjectName} icon`}
                          width={24}
                          height={24}
                          className="mr-2"
                        />
                      )}
                      <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                        {list.name}
                      </span>
                    </div>
                    <div className="flex-grow"></div>
                    <div className="flex items-center pr-2">
                      {Array.isArray(list.data) && list.data.length === 1
                        ? "1 woord"
                        : `${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                    </div>
                  </Link>

                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-auto">
                    <CreatorLink
                      creator={list.creator}
                      prefetchedName={list.prefetchedName}
                      prefetchedJdenticonValue={list.prefetchedJdenticonValue}
                    />
                  </div>

                  {/* Action buttons for list owner or admin */}
                  {(list.creator === currentUserName || currentUserRole === "admin") && (
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
                          listId={String(list.list_id)}
                          isCreator={true}
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
            {currentUserName
              ? `Je hebt nog geen ${subjectName} lijsten gemaakt`
              : 'Log in om je eigen lijsten te zien'}
          </div>
        )}
      </div>
    );
  }

  if (selectedTab === "forum") {
    return (
      <div className="mt-4 px-6">
        {forumPosts.length > 0 ? (
          <div className="space-y-4">
            {forumPosts.map((post) => (
              <Link key={post.post_id} href={`/home/forum/${post.post_id}`}>
                <div className="tile bg-neutral-800 hover:bg-neutral-700 transition-colors text-white py-3 px-6 mx-4 rounded-lg">
                  <div className="flex items-center mb-1">
                    <h3 className="text-lg font-bold">{post.title}</h3>
                    <div className="flex-grow"></div>
                    <span className="text-sm text-gray-400">
                      {formatRelativeTime(new Date(post.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-gray-400">
                    <span>Door: {creatorNameMap[post.creator as string] || 'Onbekend'}</span>
                    <span className="mx-2">•</span>
                    <span>{replyCountMap[String(post.post_id)] || 0} antwoorden</span>
                    <span className="mx-2">•</span>
                    <span>{post.votes} stemmen</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
            Er zijn nog geen forumvragen voor {subjectName}
          </div>
        )}
      </div>
    );
  }

  if (selectedTab === "statistics") {
    return (
      <div className="mt-4 px-6 flex flex-col items-center justify-center">
        <Image src={construction} alt="under construction!" width={500} height={100} />
        <p className="text-lg mt-4">Statistieken voor {subjectName} komen binnenkort!</p>
      </div>
    );
  }

  // Fallback for invalid tab
  return (
    <div className="mt-4 px-6">
      <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
        Ongeldige tab. Selecteer een tab hierboven.
      </div>
    </div>
  );
}
