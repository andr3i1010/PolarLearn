"use server"

import { getUserFromSession } from '@/utils/auth/auth'
import { prisma } from '@/utils/prisma'
import { cookies } from 'next/headers'

export async function getFreezes() {
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")?.value as string)
    const user = await prisma.user.findFirst({
        where: {
            id: session?.id
        }
    })
    return user?.freezeCount
}

export async function getStreak() {
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")?.value as string)
    const user = await prisma.user.findFirst({
        where: {
            id: session?.id
        }
    })
    return user?.streakCount
}

export async function getWeekActivity() {
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")?.value as string)
    if (!session?.id) return []

    const user = await prisma.user.findFirst({
        where: {
            id: session.id
        },
        select: {
            streakData: true
        }
    })

    // Get dates for the past 7 days
    const today = new Date()
    const pastWeek = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0] // Format as YYYY-MM-DD
    }).reverse() // Show oldest to newest (left to right)

    // Convert the streakData JSON to a usable format
    const streakData = user?.streakData as Record<string, string> || {}

    // Map the dates to statuses - only entries that exist in the database will be 'done' or 'frozen'
    return pastWeek.map(date => {
        const status = streakData[date] || 'none' // Default to 'none' if no data
        return { date, status }
    })
}