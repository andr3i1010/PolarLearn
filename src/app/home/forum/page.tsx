export const dynamic = "force-dynamic";

import Tabs, { TabItem } from "@/components/Tabs";
import { prisma } from "@/utils/prisma";
import ForumDialog from "./ForumDialog";
import Image from "next/image";
import Link from "next/link";
import Jdenticon from "@/components/Jdenticon";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { getUserFromSession } from "@/utils/auth/auth";
import DeletePostButton from "@/components/DeletePostButton";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Import the subject icons
import nsk_img from "@/app/img/nask.svg";
import math_img from "@/app/img/math.svg";
import eng_img from "@/app/img/english.svg";
import fr_img from "@/app/img/baguette.svg";
import de_img from "@/app/img/pretzel.svg";
import nl_img from "@/app/img/nl.svg";
import ak_img from "@/app/img/geography.svg";
import gs_img from "@/app/img/history.svg";
import bi_img from "@/app/img/bio.svg";
import { cookies } from "next/headers";
import MarkdownRenderer from "@/components/md";

// Create a map for subject icons
const subjectIconMap: Record<string, any> = {
  WI: math_img,
  NSK: nsk_img,
  NE: nl_img,
  EN: eng_img,
  FR: fr_img,
  DE: de_img, // Note: ForumDialog uses "DE" but we're using "DU" here  // waarom? // door kut copilot
  AK: ak_img,
  GS: gs_img,
  BI: bi_img,
};

// Subject labels
const subjectLabelMap: Record<string, string> = {
  AK: "Aardrijkskunde",
  BI: "Biologie",
  DE: "Duits",
  EN: "Engels",
  FR: "Frans",
  GS: "Geschiedenis",
  NA: "Natuurkunde",
  NSK: "NaSk",
  NE: "Nederlands",
  SK: "Scheikunde",
  WI: "Wiskunde",
};

export default async function ForumHome({
  searchParams,
  params,
}: {
  searchParams: Promise<{ page?: string }>;
  params?: { tab?: string[] };
}) {
  const defaultActiveTab =
    params && params.tab && params.tab.length > 0 ? params.tab[0] : "questions";

  const session = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")!.value
  );
  const user = await prisma.user.findFirst({
    where: {
      name: session!.name,
    },
  });

  // Get the user's ID for queries
  const userId = session?.id;
  const userName = session?.name;

  const paramsSearch = await searchParams;
  const page = parseInt(paramsSearch.page as string) || 1;
  const take = 20;
  const skip = (page - 1) * take;

  // Fetch current page posts and total count concurrently
  const [forumPosts, totalPosts] = await Promise.all([
    prisma.forum.findMany({
      where: { type: "thread" },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.forum.count({
      where: { type: "thread" },
    }),
  ]);

  // Fetch user's questions with flexible matching - check both ID and name
  const [myQuestions, myQuestionsTotal] = await Promise.all([
    prisma.forum.findMany({
      where: {
        type: "thread",
        OR: [
          { creator: userId },
          { creator: userName as string }
        ]
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.forum.count({
      where: {
        type: "thread",
        OR: [
          { creator: userId },
          { creator: userName as string }
        ]
      },
    }),
  ]);

  // Fetch user's answers - also check both ID and name
  const [myReplies, myRepliesTotal] = await Promise.all([
    prisma.forum.findMany({
      where: {
        type: "reply",
        OR: [
          { creator: userId },
          { creator: userName as string }
        ]
      },
      orderBy: { createdAt: "desc" },
      select: {
        post_id: true,
        replyTo: true,
        content: true,
        creator: true,
        createdAt: true,
        subject: true,
      },
      skip,
      take,
    }),
    prisma.forum.count({
      where: {
        type: "reply",
        OR: [
          { creator: userId },
          { creator: userName as string }
        ]
      },
    }),
  ]);

  // Get the parent thread information for context
  const parentIds = myReplies.map((reply) => reply.replyTo).filter(Boolean) as string[];
  const parentThreads = await prisma.forum.findMany({
    where: {
      post_id: {
        in: parentIds,
      },
    },
    select: {
      post_id: true,
      title: true,
    },
  });

  // Create a map of parent thread titles for quick lookup
  const parentThreadMap = parentThreads.reduce((acc, thread) => {
    acc[thread.post_id] = thread.title;
    return acc;
  }, {} as Record<string, string>);

  // Enhance the reply objects with parent thread titles
  const enhancedReplies = myReplies.map((reply) => ({
    ...reply,
    title: parentThreadMap[reply.replyTo || ""] || "Onbekende thread", // Fallback title if parent not found
    isReply: true, // Flag to identify this as a reply for UI handling
  }));

  const totalPages = Math.ceil(totalPosts / take);
  const myQuestionsPages = Math.ceil(myQuestionsTotal / take);
  const myAnswersPages = Math.ceil(myRepliesTotal / take);

  // Also update the currentUsername variable to include both user ID and name for comparison
  const currentUsername = session?.name;
  const currentUserId = session?.id;

  // Get unique creator IDs from all forum posts
  const allPosts = [...forumPosts, ...myQuestions, ...enhancedReplies];
  const creatorIds = [...new Set(allPosts.map((post) => post.creator))];

  // Also try to fetch users by name in case creator contains usernames
  const users = await prisma.user.findMany({
    where: {
      OR: [{ id: { in: creatorIds } }, { name: { in: creatorIds } }],
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
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

  // Function to render post list
  const renderPostList = (posts: any[], totalPages: number, currentPage: number, tabId: string) => (
    <>
      <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden">
        {posts.length > 0 ? (
          posts.map((post) => {
            const user =
              userMapById[post.creator] || userMapByName[post.creator];
            const subjectIcon = subjectIconMap[post.subject];
            const subjectLabel =
              subjectLabelMap[post.subject] || post.subject;
            const relativeTime = formatRelativeTime(post.createdAt);
            const isReply = post.isReply === true;

            // Check if current user is the creator
            const isPostCreator =
              currentUserId === post.creator ||
              currentUsername === post.creator ||
              (user?.name && currentUsername === user.name);

            return (
              <div key={post.post_id} className="relative">
                <Link href={`/home/forum/${isReply ? post.replyTo : post.post_id}`} className="block">
                  <div
                    className={`border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all flex items-center cursor-pointer`}
                  >
                    <div className="mr-4 flex-shrink-0">
                      {user?.image ? (
                        <Image
                          src={user.image}
                          alt={`de profielfoto van ${user.name || "iemand"}`}
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
                        <span className="text-gray-500">
                          Door: {user?.name || post.creator}
                        </span>
                      </div>
                      <h3 className="font-medium text-lg">
                        {isReply ? (
                          <>
                            <span className="text-gray-400 font-normal text-sm">Antwoord op: </span>
                            {post.title}
                          </>
                        ) : (
                          post.title
                        )}
                      </h3>
                      {isReply && (
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                          {post.content.length > 100
                            ? `${post.content.substring(0, 100)}...`
                            : post.content}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Position the delete button absolutely to not interfere with the link */}
                {isPostCreator && (
                  <div className="absolute top-4 right-4 z-10">
                    <DeletePostButton
                      postId={post.post_id}
                      isCreator={true}
                      isMainPost={!isReply}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-400">
            {tabId === "my-questions"
              ? "Je hebt nog geen vragen gesteld."
              : "Je hebt nog geen antwoorden gegeven."}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationPrevious>
              {currentPage > 1 ? (
                <Link href={`/home/forum/${tabId}?page=${currentPage - 1}`}>Vorige</Link>
              ) : (
                <span className="text-gray-400">Vorige</span>
              )}
            </PaginationPrevious>
            {/* Render page numbers */}
            <PaginationContent>
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href={`/home/forum/${tabId}?page=${pageNum}`}
                      isActive={pageNum === currentPage}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
            </PaginationContent>
            <PaginationNext>
              {currentPage === totalPages ? (
                <span className="text-gray-400">Volgende</span>
              ) : (
                <Link href={`/home/forum/${tabId}?page=${currentPage + 1}`}>Volgende</Link>
              )}
            </PaginationNext>
          </Pagination>
        </div>
      )}
    </>
  );

  const tabs: TabItem[] = [
    {
      id: "questions",
      label: "Alle vragen",
      content: renderPostList(forumPosts, totalPages, page, "questions"),
    },
    {
      id: "my-questions",
      label: "Mijn vragen",
      content: renderPostList(myQuestions, myQuestionsPages, page, "my-questions"),
    },
    {
      id: "my-answers",
      label: "Mijn antwoorden",
      content: renderPostList(enhancedReplies, myAnswersPages, page, "my-answers"),
    },
    {
      id: "how-the-forum-works",
      label: "Hoe werkt het forum?",
      content: (
        <MarkdownRenderer
          content={`
## Hoe werkt het forum?

---

Welkom op ons forum! Hier kun je vragen stellen, antwoorden geven en punten verdienen terwijl je leert en anderen helpt, of gewoon chatten.

### 🔍 Zoeken naar antwoorden

Voordat je een nieuwe vraag stelt, gebruik de zoekbalk om te kijken of jouw vraag al eerder is beantwoord.<br />
Dit bespaart tijd en helpt om dubbele vragen te voorkomen.

### ❓ Vragen stellen

Heb je een vraag? Plaats deze in de juiste categorie en wees zo duidelijk mogelijk.<br />
Hoe specifieker je vraag, hoe sneller en beter de antwoorden zullen zijn!

Bij het stellen van een vraag kun je labels toevoegen om aan te geven of je vraag over school gaat of niet.<br />
Zo kunnen anderen makkelijker de juiste vragen vinden.

### 💬 Antwoorden geven

Help anderen door antwoorden te geven op vragen.<br />
Zorg ervoor dat je uitleg helder en behulpzaam is.

### ⭐ Punten verdienen

Je verdient punten door actief bij te dragen:

* ✅ Een goedgekeurd antwoord geven: **+50** punten!
* 👍 Een upvote ontvangen op jouw antwoord: +1 punt
* ❓ Een vraag stellen: +10 punten

Met punten verdien je prestaties die je als titel in kan stellen onder je naam! En het ziet er gewoon cool uit.

### 🚨 Moderatie

Alleen vragen die ongepast, spam of beledigend zijn, worden verwijderd.

In tegenstelling tot StudyGo mag je hier dus ook vragen stellen die niet over school gaan!

---

Veel leerplezier! 🚀
    `}
        >
        </MarkdownRenderer>
      ),
    },
  ];
  let banned = false;
  if (!user!.forumAllowed || !user!.loginAllowed) {
    banned = true;
  }

  // Determine the base route dynamically
  // This extracts everything before the last segment which would be the tab ID
  let baseRoute = "/home/forum";

  // If we have a tab in the params, we're already at a subroute
  if (params?.tab && params.tab.length > 0) {
    // We're in a route like /home/forum/[tab] - the base path is everything before the tab
    baseRoute = "/home/forum";
  }

  return (
    <>
      <div className="py-6 pl-6">
        <div className="flex items-center">
          <h1 className="text-4xl font-extrabold mb-4">Forum</h1>
          <div className="flex-grow"></div>
          <ForumDialog
            banned={banned}
            banreason={user?.forumBanReason}
            banEnd={user?.forumBanEnd} // pass new banEnd prop
          />
          <div className="w-4" />
        </div>
        <Tabs
          tabs={tabs}
          defaultActiveTab={defaultActiveTab}
          withRoutes={true}
          baseRoute={baseRoute} // Use dynamically derived base route
        />
      </div>
    </>
  );
}
