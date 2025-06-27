import { NextRequest, NextResponse } from "next/server"
import VoteServer from "@/components/voteServer"

type VoteDirection = "up" | "down" | null

interface VoteRequestBody {
  postId: string
  direction: VoteDirection
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: VoteRequestBody = await request.json()
    const { postId, direction } = body

    if (!postId) {
      return NextResponse.json(
        { success: false, error: "Post ID is required" },
        { status: 400 }
      )
    }

    // Call the existing server action
    const result = await VoteServer(postId, direction)

    // Return the result from the server action
    return NextResponse.json(result)

  } catch (error) {
    console.error("Vote API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
