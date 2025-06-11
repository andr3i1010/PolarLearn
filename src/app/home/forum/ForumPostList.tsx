"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Jdenticon from "@/components/Jdenticon";
import DeletePostButton from "@/components/DeletePostButton";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { Badge } from "@/components/ui/badge";
import {
  Book,
  Megaphone,
  MessageCircle,
  MessageCircleQuestion,
  Pin,
} from "lucide-react";
import InfiniteScroll from "react-infinite-scroll-component";
import { getPosts } from "./getPosts";
import { icons, getSubjectName } from "@/components/icons";

interface ForumPostListProps {
  initialPosts: any[];
  initialTotal: number;
  initialUserMapById: Record<string, any>;
  initialUserMapByName: Record<string, any>;
  tab: "questions" | "my-questions" | "my-answers";
  currentUsername: string | null;
  currentUserId: string | null;
  userRole: string | null;
}

export default function ForumPostList({
  initialPosts,
  initialTotal,
  initialUserMapById,
  initialUserMapByName,
  tab,
  currentUsername,
  currentUserId,
  userRole,
}: ForumPostListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);
  const [userMapById, setUserMapById] = useState(initialUserMapById);
  const [userMapByName, setUserMapByName] = useState(initialUserMapByName);
  const [loading, setLoading] = useState(false);

  const loadMorePosts = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await getPosts(tab, posts.length, 20);

      if (result.posts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...result.posts]);
        // Only set hasMore to false if we've loaded all posts
        setHasMore(result.posts.length + posts.length < result.total);
      }

      // Merge user maps
      setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
      setUserMapByName((prev) => ({ ...prev, ...result.userMapByName }));
    } catch (error) {
      console.error("Error loading more posts:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  if (posts.length === 0 && !hasMore) {
    return (
      <div className="p-8 text-center text-gray-400">
        {tab === "my-questions"
          ? "Je hebt nog geen vragen gesteld."
          : tab === "my-answers"
            ? "Je hebt nog geen antwoorden gegeven."
            : "Geen posts gevonden."}
      </div>
    );
  }

  // Sort posts to ensure pinned posts are at the top
  const sortedPosts = [...posts].sort((a, b) => {
    // First sort by pinned status (pinned posts first)
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // Then by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="rounded-md overflow-hidden">
      <InfiniteScroll
        dataLength={sortedPosts.length}
        next={loadMorePosts}
        hasMore={hasMore}
        loader={
          <div className="text-center p-4 bg-neutral-800 border border-neutral-700">
            Laden...
          </div>
        }
        scrollThreshold={0.8}
        style={{ overflow: "visible" }}
      >
        <div className="border border-neutral-700 rounded-md overflow-hidden bg-neutral-800">
          {sortedPosts.map((post) => {
            const creatorId =
              typeof post.creator === "string"
                ? post.creator
                : String(post.creator);
            const user = userMapById[creatorId] || userMapByName[creatorId];
            const subjectIcon = icons[post.subject as keyof typeof icons];
            const subjectLabel = getSubjectName(post.subject) || post.subject;
            const relativeTime = formatRelativeTime(post.createdAt);
            const isReply = post.isReply === true;

            // Check if current user is the creator
            const isPostCreator =
              currentUserId === post.creator ||
              currentUsername === post.creator ||
              (user?.name && currentUsername === user.name) ||
              userRole === "admin";

            let category = "";
            let catBagdeColor = "";
            let categoryIcon;
            switch (post.category) {
              case "school":
                category = "School-gerelateerd";
                catBagdeColor = "bg-blue-500";
                categoryIcon = <Book />;
                break;
              case "general":
                category = "Niet school-gerelateerd";
                catBagdeColor = "bg-green-500";
                categoryIcon = <MessageCircle />;
                break;
              case "help":
                category = "Hulp";
                catBagdeColor = "bg-yellow-500";
                categoryIcon = <MessageCircleQuestion />;
                break;
              case "announcement":
                category = "Aankondiging";
                catBagdeColor = "bg-red-500";
                categoryIcon = <Megaphone />;
                break;
            }

            return (
              <div key={post.post_id} className="relative">
                <Link
                  href={`/home/forum/${isReply ? post.replyTo : post.post_id}`}
                  className="block"
                >
                  <div
                    className={`border-b border-neutral-700 last:border-b-0 p-4 hover:bg-neutral-700 transition-all flex items-start sm:items-center cursor-pointer ${post.pinned ? "bg-green-900/10" : ""
                      }`}
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
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1 flex flex-wrap items-center gap-1">
                        {post.pinned && (
                          <>
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-500 flex items-center gap-1"
                            >
                              <Pin size={12} />
                              Vastgezet
                            </Badge>
                            <span className="mx-1.5">•</span>
                          </>
                        )}
                        {post.category && (
                          <>
                            <Badge
                              variant="outline"
                              className={`text-xs ${catBagdeColor}`}
                            >
                              {categoryIcon}
                              {category}
                            </Badge>
                            <span className="mx-1.5">•</span>
                          </>
                        )}
                        {subjectIcon && (
                          <Image
                            src={subjectIcon}
                            alt={subjectLabel}
                            width={16}
                            height={16}
                            className="mr-1"
                          />
                        )}
                        {post.subject && (
                          <>
                            <span>{subjectLabel}</span>
                            <span className="mx-1.5">•</span>
                          </>
                        )}
                        <span className="text-gray-500">{relativeTime}</span>
                        <span className="mx-1.5">•</span>
                        <span className="text-gray-500 truncate">
                          Door: {user?.name || post.creator}
                        </span>
                      </div>
                      <h3 className="font-medium text-lg break-words">
                        {isReply ? (
                          <>
                            <span className="text-gray-400 font-normal text-sm">
                              Antwoord op:{" "}
                            </span>
                            {post.title}
                          </>
                        ) : (
                          post.title
                        )}
                      </h3>
                      {isReply && (
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2 break-words">
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
                      isCreator={currentUserId === post.creator || currentUsername === post.creator}
                      isMainPost={!isReply}
                      title={post.title}
                      creatorId={post.creator}
                      isAdmin={userRole === "admin"}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </InfiniteScroll>
    </div>
  );
}
