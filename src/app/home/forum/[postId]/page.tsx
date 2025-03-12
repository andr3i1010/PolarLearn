import { prisma } from "@/utils/prisma"
import Image from "next/image"
import Jdenticon from "@/components/Jdenticon"
import { formatRelativeTime } from "@/utils/formatRelativeTime"
import Button1 from "@/components/button/Button1"
import VoteButtons from "@/components/VoteButtons"
import { auth } from "@/utils/auth"

// Define the structure for vote data
interface VoteData {
  users: Record<string, "up" | "down" | null>;
}

export default async function Page({
    params,
}: {
    params: { postId: string }
}) {
    const { postId } = await params
    const session = await auth()
    
    const post = await prisma.forum.findUnique({
        where: {
            post_id: postId
        }
    })
    
    if (!post) {
        return <div>Post not found</div>
    }
    
    const postcreator = await prisma.user.findUnique({
        where: {
            id: post.creator as string
        }
    })

    // Get user's current vote if logged in
    let userVote: "up" | "down" | null = null;
    
    if (session?.user?.name && post.votes_data) {
        // Safely access vote data
        const votesData = post.votes_data as unknown;
        
        // Check if it's an object with a users property
        if (
            votesData && 
            typeof votesData === 'object' && 
            'users' in votesData && 
            votesData.users && 
            typeof votesData.users === 'object'
        ) {
            const typedVotesData = votesData as VoteData;
            userVote = typedVotesData.users[session.user.name] || null;
        }
    }

    const relativeTime = formatRelativeTime(post.createdAt);

    return (
        <div className="px-4 py-4">
            <div className="flex items-center mb-6">
                <div className="mr-4">
                    {postcreator?.image ? (
                        <Image 
                            src={postcreator.image} 
                            alt={`de profielfoto van ${postcreator.name || 'iemand'}`}
                            width={48} 
                            height={48}
                            className="rounded-full"
                        />
                    ) : (
                        <Jdenticon 
                            value={postcreator?.name || post.creator} 
                            size={48} 
                        />
                    )}
                </div>
                <div className="flex-grow">
                    <h3 className="font-medium">{postcreator?.name || 'Gebruiker'}</h3>
                    <p className="text-sm text-gray-400">{relativeTime}</p>
                </div>
                <VoteButtons postId={post.post_id} initialVotes={post.votes} initialUserVote={userVote} />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
            <div className="prose prose-invert max-w-none">
                {post.content}
            </div>
            <br/>
            <Button1 text="Beantwoorden"/>
        </div>
    )
}