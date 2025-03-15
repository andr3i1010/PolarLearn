import Tabs, { TabItem } from '@/components/Tabs';
import { prisma } from '@/utils/prisma';
import ForumDialog from './ForumDialog';
import Image from 'next/image';
import Link from 'next/link';
import Jdenticon from '@/components/Jdenticon';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { auth } from "@/utils/auth";
import DeletePostButton from "@/components/DeletePostButton";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Import the subject icons
import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/english.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';
import gs_img from '@/app/img/history.svg';
import bi_img from '@/app/img/bio.svg';

// Create a map for subject icons
const subjectIconMap: Record<string, any> = {
  "WI": math_img,
  "NSK": nsk_img,
  "NE": nl_img,
  "EN": eng_img,
  "FR": fr_img,
  "DU": de_img, // Note: ForumDialog uses "DE" but we're using "DU" here
  "AK": ak_img,
  "GS": gs_img,
  "BI": bi_img,
};

// Subject labels
const subjectLabelMap: Record<string, string> = {
  "AK": "Aardrijkskunde",
  "BI": "Biologie",
  "DU": "Duits",
  "EN": "Engels",
  "FR": "Frans",
  "GS": "Geschiedenis",
  "NA": "Natuurkunde",
  "NSK": "NaSk",
  "NE": "Nederlands",
  "SK": "Scheikunde",
  "WI": "Wiskunde"
};

export default async function ForumHome({
  searchParams
}: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth()
  const user = await prisma.user.findFirst({
    where: {
      name: session!.user.name as string
    }
  })
  const params = await searchParams;
  const page = parseInt(params.page as string) || 1;
  const take = 20;
  const skip = (page - 1) * take;

  // Fetch current page posts and total count concurrently
  const [forumPosts, totalPosts] = await Promise.all([
    prisma.forum.findMany({
      where: { type: "thread" },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.forum.count({
      where: { type: "thread" }
    })
  ]);

  const totalPages = Math.ceil(totalPosts / take);

  const currentUsername = session?.user?.name || null;

  // Get unique creator IDs from forum posts
  const creatorIds = [...new Set(forumPosts.map(post => post.creator))];

  // Also try to fetch users by name in case creator contains usernames
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: { in: creatorIds } },
        { name: { in: creatorIds } }
      ]
    },
    select: {
      id: true,
      name: true,
      image: true
    }
  });

  // Create maps for both ID and name lookups
  const userMapById = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, any>);

  const userMapByName = users.reduce((acc, user) => {
    if (user.name) acc[user.name] = user;
    return acc;
  }, {} as Record<string, any>);

  const tabs: TabItem[] = [
    {
      id: 'alle',
      label: 'Alle vragen',
      content: (
        <>
          <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden">
            {forumPosts.map((post) => {
              const user = userMapById[post.creator] || userMapByName[post.creator];
              const subjectIcon = subjectIconMap[post.subject];
              const subjectLabel = subjectLabelMap[post.subject] || post.subject;
              const relativeTime = formatRelativeTime(post.createdAt);


              // Check if current user is the creator - with more flexibility
              const isPostCreator = currentUsername === post.creator ||
                (user?.name && currentUsername === user.name);

              return (
                <div key={post.post_id} className="relative">
                  <Link
                    href={`/home/forum/${post.post_id}`}
                    className="block"
                  >
                    <div
                      className={`border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all flex items-center cursor-pointer`}
                    >
                      <div className="mr-4 flex-shrink-0">
                        {user?.image ? (
                          <Image
                            src={user.image}
                            alt={`de profielfoto van ${user.name || 'iemand'}`}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <Jdenticon
                            value={user?.name || post.creator}
                            size={40}
                          />
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="text-xs text-gray-400 mb-1 flex items-center">
                          {subjectIcon && (
                            <Image
                              src={subjectIcon}
                              alt={subjectLabel}
                              width={16}
                              height={16}
                              className="mr-1"
                            />
                          )}
                          <span>{subjectLabel}</span>
                          <span className="mx-1.5">•</span>
                          <span className="text-gray-500">{relativeTime}</span>
                          <span className="mx-1.5">•</span>
                          <span className="text-gray-500">Door: {user?.name || post.creator}</span>
                        </div>
                        <h3 className="font-medium text-lg">{post.title}</h3>
                      </div>
                    </div>
                  </Link>

                  {/* Position the delete button absolutely to not interfere with the link */}
                  {isPostCreator && (
                    <div className="absolute top-4 right-4 z-10">
                      <DeletePostButton
                        postId={post.post_id}
                        isCreator={true}
                        isMainPost={true}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationPrevious>
                  {page > 1 ? (
                    <Link href={`?page=${page - 1}`}>Vorige</Link>
                  ) : (
                    <span className="text-gray-400">Vorige</span>
                  )}
                </PaginationPrevious>
                {/* Render page numbers */}
                <PaginationContent>
                  {
                    Array.from({ length: totalPages }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink href={`?page=${pageNum}`} isActive={pageNum === page}>
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })
                  }
                </PaginationContent>
                <PaginationNext>
                  {page === totalPages ? (
                    <span className="text-gray-400">Volgende</span>
                  ) : (
                    <Link href={`?page=${page + 1}`}>Volgende</Link>
                  )}
                </PaginationNext>
              </Pagination>
            </div>
          )}
        </>
      )
    },
    {
      id: 'mijn',
      label: 'Mijn vragen',
      content: <div>Content for Mijn vragen</div>
    },
    {
      id: 'antwoorden',
      label: 'Mijn antwoorden',
      content: <div>Content for Mijn antwoorden</div>
    },
    {
      id: 'hoe',
      label: 'Hoe werkt de forum?',
      content: <div>Content for Hoe werkt de forum?</div>
    }
  ];
  let banned = false
  if (!user!.forumAllowed || !user!.loginAllowed) {
    // return {
    //   success: false,
    //   error: `Je bent ${user!.forumBanEnd ? `tot ${user!.forumBanEnd}` : 'permanent'} verbannen van PolarLearn's forums. Reden:`
    // };
    banned = true
  }
  return (
    <>
      <div className="py-6 pl-6">
        <div className='flex items-center'>
          <h1 className="text-4xl font-extrabold mb-4">
            Forum
          </h1>
          <div className="flex-grow"></div>
          <ForumDialog 
            banned={banned} 
            banreason={user?.forumBanReason}
            banEnd={user?.forumBanEnd}  // pass new banEnd prop
          />
          <div className='w-4' />
        </div>
        <Tabs tabs={tabs} defaultActiveTab="alle" />
      </div>
    </>
  );
}