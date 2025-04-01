"use client"

import { useState } from "react"
import { ArrowBigUp, ArrowBigDown } from "lucide-react"
import VoteServer from "./voteServer"
import { toast } from "react-toastify" // assuming you use toast for notifications

type VoteStatus = "up" | "down" | null

// Updated User type: allow name to be string | null
interface User {
  id: string;
  name: string | null;  // changed to allow null
  // ...other user properties...
}

interface VoteButtonsProps {
  postId: string
  initialVotes: number
  initialUserVote?: VoteStatus
  user?: User | null   // new prop provided from server side
}

export default function VoteButtons({ postId, initialVotes, initialUserVote = null, user }: VoteButtonsProps) {
  const [voteStatus, setVoteStatus] = useState<VoteStatus>(initialUserVote)
  const [votes, setVotes] = useState(initialVotes)
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (direction: VoteStatus) => {
    // Check if user was provided from the server (i.e. is authenticated)
    if (!user) {
      toast.error("Je moet ingelogd zijn om te kunnen stemmen!")
      return
    }
    if (isVoting) return
    setIsVoting(true)

    const prevVoteStatus = voteStatus
    const prevVotes = votes

    try {
      if (voteStatus === direction) {
        // Cancel vote
        setVoteStatus(null)
        setVotes(prevVotes => direction === 'up' ? prevVotes - 1 : prevVotes + 1)
        await VoteServer(postId, null)
      } else {
        // New vote or change vote
        let adjustment = 0
        if (voteStatus === null) {
          adjustment = direction === 'up' ? 1 : -1
        } else {
          adjustment = direction === 'up' ? 2 : -2
        }

        setVotes(prevVotes => prevVotes + adjustment)
        setVoteStatus(direction)

        await VoteServer(postId, direction)
      }
    } catch (error) {
      console.error("Vote error:", error)
      setVoteStatus(prevVoteStatus)
      setVotes(prevVotes)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        className={`p-1 rounded-full hover:bg-neutral-700 transition-colors ${voteStatus === 'up' ? 'text-blue-500' : 'text-gray-400'
          }`}
        onClick={() => handleVote('up')}
        disabled={!user}
        aria-label="Upvote"
      >
        <ArrowBigUp size={24} />
      </button>

      <span className={`font-medium text-base px-2 ${voteStatus === 'up' ? 'text-blue-500' :
          voteStatus === 'down' ? 'text-red-500' : 'text-gray-300'
        }`}>
        {votes}
      </span>

      <button
        className={`p-1 rounded-full hover:bg-neutral-700 transition-colors ${voteStatus === 'down' ? 'text-red-500' : 'text-gray-400'
          }`}
        onClick={() => handleVote('down')}
        disabled={!user}
        aria-label="Downvote"
      >
        <ArrowBigDown size={24} />
      </button>
    </div>
  )
}
