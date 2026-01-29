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
    const body = await request.json();
    const { postId, direction } = body;


    if (!postId) {
      return NextResponse.json(
        { success: false, error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Validate postId as UUID (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(postId)) {
      return NextResponse.json(
        { success: false, error: "Invalid postId format. Must be a valid UUID." },
        { status: 400 }
      );
    }

    // Validate direction strictly at runtime
    const validDirections = ["up", "down", null];
    if (!validDirections.includes(direction)) {
      return NextResponse.json(
        { success: false, error: "Invalid vote direction. Must be 'up', 'down', or null." },
        { status: 400 }
      );
    }

    // Call the existing server action
    const result = await VoteServer(postId, direction);

    // Return the result from the server action
    return NextResponse.json(result);

  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
