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
        return 'success'
    } catch (error) {
        console.error(error)
        return 'error'
    }
}

export async function banUserForum(userId: string, banReason: string, banEnd: Date) {
    try {
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                forumAllowed: false,
                forumBanReason: banReason,
                forumBanEnd: banEnd
            }
        })
        return 'success'
    } catch (error) {
        console.error(error)
        return 'error'
    }
}