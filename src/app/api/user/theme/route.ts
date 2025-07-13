import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/serverActions/getCurrentUser'
import { prisma } from '@/utils/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch the user's theme from the database
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { theme: true }
    })

    return NextResponse.json({ theme: userData?.theme || 'dark' })
  } catch (error) {
    console.error('Error getting theme:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { theme } = await request.json()

    if (!theme || !['light', 'dark'].includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value' },
        { status: 400 }
      )
    }

    // Update the user's theme preference in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { theme: theme }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating theme:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
