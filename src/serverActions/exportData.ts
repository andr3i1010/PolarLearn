"use server"

import { getUserFromSession } from "@/utils/auth/auth"
import { prisma } from "@/utils/prisma"

export async function exportUserData() {
  const user = await getUserFromSession()
  if (!user) {
    return { success: false, message: "Je moet ingelogd zijn om data te exporteren." }
  }

  const now = new Date()
  const lastExportedAt = (user as any).lastExportedAt as Date | undefined

  if (lastExportedAt) {
    const diffDays = (now.getTime() - lastExportedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays < 30) {
      const nextAvailableAtDate = new Date(lastExportedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
      const nextAvailableAt = nextAvailableAtDate.toISOString()
      return {
        success: false,
        message: `Je kunt je data pas opnieuw exporteren op ${nextAvailableAtDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        nextAvailableAt,
      }
    }
  }

  // Fetch fresh user data
  const freshUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!freshUser) {
    return { success: false, message: "Gebruiker niet gevonden." }
  }

  // Prepare detailed list data
  const listData = (freshUser.list_data as any) || {}
  const recentListIds: string[] = listData.recent_lists || []
  const createdListIds: string[] = listData.created_lists || []
  const recent_lists = await prisma.practice.findMany({ where: { list_id: { in: recentListIds } } })
  const created_lists = await prisma.practice.findMany({ where: { list_id: { in: createdListIds } } })

  // Prepare detailed group data
  const ownGroupIds: string[] = (freshUser.ownGroups as string[]) || []
  const inGroupIds: string[] = (freshUser.inGroups as string[]) || []
  const ownGroups = await prisma.group.findMany({ where: { groupId: { in: ownGroupIds } } })
  const inGroups = await prisma.group.findMany({ where: { groupId: { in: inGroupIds } } })

  const data = {
    id: freshUser.id,
    name: freshUser.name,
    email: freshUser.email,
    list_data: {
      recent_lists,
      created_lists,
      recent_subjects: listData.recent_subjects || [],
      streak: listData.streak || 0,
    },
    forumAllowed: freshUser.forumAllowed,
    createdAt: freshUser.createdAt,
    updatedAt: freshUser.updatedAt,
    ownGroups,
    inGroups,
    streakCount: freshUser.streakCount,
    streakData: freshUser.streakData,
    freezeCount: freshUser.freezeCount,
    forumPoints: freshUser.forumPoints,
    notificationData: freshUser.notificationData,
    loginAllowed: freshUser.loginAllowed,
  }

  // Update last export timestamp
  await prisma.user.update({ where: { id: user.id }, data: { lastExportedAt: now } as any })

  return { success: true, data }
}
