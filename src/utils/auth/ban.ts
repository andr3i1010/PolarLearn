"use server";

import { prisma } from "../prisma";

export async function banUserPlatform(userId: string, banReason: string) {
    try {
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                loginAllowed: false,
                banReason: banReason
            }
        })
    } catch (error) {
        console.error(error)
    }
}

export async function banUserForum(userId: string, banReason: string) {
    try {
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                forumAllowed: false,
                forumBanReason: banReason,
            }
        })
    } catch (error) {
        console.error(error)
    }
}
export async function unbanUserPlatform(userId: string) {
    try {
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                loginAllowed: true,
                banReason: null
            }
        })
    } catch (error) {
        console.error(error)
    }
}
export async function unbanUserForum(userId: string) {
    try {
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                forumAllowed: true,
                forumBanReason: null,
                forumBanEnd: null
            }
        })
    } catch (error) {
        console.error(error)
    }
}