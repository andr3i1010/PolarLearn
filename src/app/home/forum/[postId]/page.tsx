import { prisma } from "@/utils/prisma";
import Image from "next/image";
import Jdenticon from "@/components/Jdenticon";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import VoteButtons from "@/components/VoteButtons";
import { getUserFromSession } from "@/utils/auth/auth";
import ForumReply from "@/components/ForumReply";
import DeletePostButton from "@/components/DeletePostButton";
import PinPostButton from "@/components/PinPostButton";
import MarkdownRenderer from "@/components/md";
import { cookies } from "next/headers";
import CreatorLink from "@/components/links/CreatorLink";
import ForumHome from "../page";
import { getUserNameById } from "@/serverActions/getUserName";
import EditPostBtn from "./editPostBtn";
import { icons, getSubjectName } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import {
  Book,
  MessageCircle,
  MessageCircleQuestion,
  Megaphone,
} from "lucide-react";
import ForumRepliesList from "../ForumRepliesList";

// UUID validation regex pattern
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Define the structure for vote data
interface VoteData {
  users: Record<string, "up" | "down" | null>;
}

export default async function Page({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  // If postId is actually a tab identifier, delegate to ForumHome
  if (
    ["questions", "my-questions", "my-answers", "how-the-forum-works"].includes(
      postId
    )
  ) {
    return (
      <ForumHome
        searchParams={Promise.resolve({})}
        params={{ tab: [postId] }}
      />
    );
  }

  const session = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );
  const currentUsername = session?.name || null;

  const post = await prisma.forum.findUnique({
    where: {
      post_id: postId,
    },
  });

  if (!post) {
    return <div>Post not found</div>;
  }

  // Check if user is admin
  const isAdmin = session?.role === "admin";

  // Check if post creator is a UUID and get the proper display name if needed
  let jdenticonPostValue = post.creator;
  if (UUID_REGEX.test(post.creator)) {
    const userInfo = await getUserNameById(post.creator);
    if (userInfo.jdenticonValue) {
      jdenticonPostValue = userInfo.jdenticonValue;
    }
  }

  // Fetch initial set of replies (first page)
  const initialRepliesData = await prisma.forum.findMany({
    where: {
      type: "reply",
      replyTo: postId,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 10, // Initial page size
  });

  // Count total replies
  const totalReplies = await prisma.forum.count({
    where: {
      type: "reply",
      replyTo: postId,
    },
  });

  // Process replies to get Jdenticon values
  const initialRepliesWithJdenticon = await Promise.all(
    initialRepliesData.map(async (reply) => {
      let jdenticonValue = reply.creator;
      if (UUID_REGEX.test(reply.creator)) {
        const userInfo = await getUserNameById(reply.creator);
        if (userInfo.jdenticonValue) {
          jdenticonValue = userInfo.jdenticonValue;
        }
      }
      return { ...reply, jdenticonValue };
    })
  );

  // Get list of creator identifiers (may be usernames or IDs)
  const creatorIdentifiers = [
    post.creator,
    ...initialRepliesData.map((reply: { creator: any }) => reply.creator),
  ];

  // Try to fetch users by ID first
  const usersById = await prisma.user.findMany({
    where: {
      id: { in: creatorIdentifiers as string[] },
    },
  });

  // If users weren't found by ID, try by name (in case creator stores username)
  const usersByName = await prisma.user.findMany({
    where: {
      name: { in: creatorIdentifiers as string[] },
    },
  });

  // Create a combined map using both id and name as keys
  const userMap: Record<string, any> = {};

  // Map users by ID
  usersById.forEach((user: { id: string | number }) => {
    if (user.id) userMap[user.id] = user;
  });

  // Map users by name
  usersByName.forEach((user: { name: string | null }) => {
    if (user.name) userMap[user.name] = user;
  });

  // Get post creator - try direct lookup or find by name
  const postcreator =
    userMap[post.creator] ||
    usersById.find((u: { id: any }) => u.id === post.creator) ||
    usersByName.find((u: { name: any }) => u.name === post.creator);

  // Check if current user is the post creator, using multiple checks
  const isPostCreator =
    currentUsername === post.creator ||
    (postcreator?.name && currentUsername === postcreator.name);

  // Get user's current vote if logged in
  let userVote: "up" | "down" | null = null;

  if (session?.name && post.votes_data) {
    // Safely access vote data
    const votesData = post.votes_data as unknown;

    // Check if it's an object with a users property
    if (
      votesData &&
      typeof votesData === "object" &&
      "users" in votesData &&
      votesData.users &&
      typeof votesData.users === "object"
    ) {
      const typedVotesData = votesData as VoteData;
      userVote = typedVotesData.users[session.name] || null;
    }
  }

  const relativeTime = formatRelativeTime(post.createdAt);
  const formattedDate = new Date(post.createdAt).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Determine category display
  let categoryDisplay = "";
  let categoryBadgeColor = "";
  let categoryIcon;

  switch (post.category) {
    case "school":
      categoryDisplay = "School-gerelateerd";
      categoryBadgeColor = "bg-blue-500";
      categoryIcon = <Book />;
      break;
    case "general":
      categoryDisplay = "Niet school-gerelateerd";
      categoryBadgeColor = "bg-green-500";
      categoryIcon = <MessageCircle />;
      break;
    case "help":
      categoryDisplay = "Hulp";
      categoryBadgeColor = "bg-yellow-500";
      categoryIcon = <MessageCircleQuestion />;
      break;
    case "announcement":
      categoryDisplay = "Aankondiging";
      categoryBadgeColor = "bg-red-500";
      categoryIcon = <Megaphone />;
      break;
  }

  // Get subject info if available
  let subjectIcon = null;
  let subjectName = null;
  if (post.category === "school" && post.subject) {
    subjectIcon = icons[post.subject as keyof typeof icons];
    subjectName = getSubjectName(post.subject) || post.subject;
  }

  return (
    <div className="px-4 py-4">
      <div className="flex flex-col mb-6">
        <div className="flex items-start sm:items-center mb-3">
          <div className="mr-4">
            {postcreator?.image ? (
              <Image
                src={postcreator.image}
                alt={`de profielfoto van ${postcreator.name || "iemand"}`}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <Jdenticon value={jdenticonPostValue} size={48} />
            )}
          </div>
          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="flex items-center">
                <CreatorLink
                  creator={postcreator?.name || post.creator}
                  color="white"
                />
              </div>
              {post.category && (
                <Badge variant="outline" className={`${categoryBadgeColor}`}>
                  {categoryIcon}
                  {categoryDisplay}
                </Badge>
              )}
              {subjectIcon && subjectName && (
                <div className="flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded-md">
                  <Image
                    src={subjectIcon}
                    alt={subjectName}
                    width={16}
                    height={16}
                  />
                  <span className="text-sm">{subjectName}</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-400 flex flex-wrap gap-2">
              <span title={formattedDate}>{relativeTime}</span>
              {post.updatedAt && post.createdAt &&
                new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000 && (
                  <span>
                    • Bewerkt
                  </span>
                )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              {/* Edit and Delete buttons for post creator */}
              {isPostCreator && (
                <>
                  <EditPostBtn
                    postId={post.post_id}
                    isCreator={true}
                    isMainPost={true}
                  />
                  <DeletePostButton
                    postId={post.post_id}
                    title={post.title}
                    creatorId={post.creator}
                    isCreator={true}
                    isAdmin={isAdmin}
                    isMainPost={true}
                  />
                </>
              )}
              {/* Admin delete button for posts not created by admin */}
              {isAdmin && !isPostCreator && (
                <DeletePostButton
                  postId={post.post_id}
                  title={post.title}
                  creatorId={post.creator}
                  isCreator={false}
                  isAdmin={true}
                  isMainPost={true}
                />
              )}
              {/* Pin button for admin */}
              {isAdmin && (
                <PinPostButton
                  postId={post.post_id}
                  isAdmin={isAdmin}
                  initialPinned={post.pinned || false}
                />
              )}
            </div>
            <VoteButtons
              postId={post.post_id}
              initialVotes={post.votes}
              initialUserVote={userVote}
              user={session}
            />
          </div>
        </div>

        <h1 className="text-3xl mb-4 font-bold">{post.title}</h1>
        <hr className="border-neutral-600 mb-4" />
        <div className="prose prose-invert max-w-none whitespace-pre-line">
          <MarkdownRenderer content={post.content} />
        </div>
      </div>

      <div className="mt-6">
        <ForumReply postId={post.post_id} userId={post.creator} />
      </div>

      {totalReplies > 0 && (
        <ForumRepliesList
          postId={postId}
          initialReplies={initialRepliesWithJdenticon}
          initialTotal={totalReplies}
          initialUserMap={userMap}
          currentUser={session}
          mainPostTitle={post.title}
        />
      )}
    </div>
  );
}
