"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { Embed, Webhook } from '@vermaysha/discord-webhook'
import { getUserFromSession } from './auth'

async function sendDiscordEmbed(embed: Embed) {
    try {
        const hook = new Webhook(process.env.DISCORD_WEBHOOK || '')
        hook.addEmbed(embed)
        await hook.send()
    } catch (err) {
        console.warn('Failed to send discord embed:', err)
    }
}

export async function banUserPlatform(userId: string, banReason: string, banEnd?: string) {
    const operator = await getUserFromSession()
    if (!operator) {
        throw new Error('Not allowed')
    }
    try {
        if (operator.role !== "admin") {
            return { success: false, error: 'Unauthorized' }
        }
        const updateData: any = {
            loginAllowed: false,
            banReason: banReason
        }
        // If a ban end date is provided, store it in scheduledDeletion (no separate field exists for platform ban)
        if (banEnd) {
            const d = new Date(banEnd)
            if (!isNaN(d.getTime())) updateData.scheduledDeletion = d
        }

        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                ...updateData
            }
        })
        await prisma.session.deleteMany({
            where: {
                userId: userId
            }
        })
        // Send a notification to Discord (include acting admin)
        try {
            let adminIdentifier = 'unknown'
            try {
                const admin = await getUserFromSession()
                if (admin) adminIdentifier = admin.name ?? admin.email ?? admin.id
            } catch { /* ignore */ }
            const embed = new Embed()
                .setTitle('Gebruiker verbannen')
                .setDescription(`De gebruiker met ID ${userId} is verbannen van het platform. met de reden: ${banReason}\nActie door: ${adminIdentifier}${banEnd ? `\nEindigt op: ${banEnd}` : ''}`)
                .setColor('#ff0000')
                .setTimestamp()
            await sendDiscordEmbed(embed)
        } catch (webhookErr) {
            console.warn('Failed to send ban webhook:', webhookErr)
        }
        revalidatePath('/admin')
    } catch (error) {
        console.error(error)
    }
}

export async function banUserForum(userId: string, banReason: string, banEnd?: string) {
    const operator = await getUserFromSession()
    if (operator.role !== "admin") {
        return { success: false, error: 'Unauthorized' }
    }
    try {
        const updateData: any = {
            forumAllowed: false,
            forumBanReason: banReason,
        }
        if (banEnd) {
            const d = new Date(banEnd)
            if (!isNaN(d.getTime())) updateData.forumBanEnd = d
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        })
        try {
            let adminIdentifier = 'unknown'
            try {
                const admin = await getUserFromSession()
                if (admin) adminIdentifier = admin.name ?? admin.email ?? admin.id
            } catch { /* ignore */ }

            const embed = new Embed()
                .setTitle('Gebruiker verbannen van het forum')
                .setDescription(`De gebruiker met ID ${userId} is verbannen van het forum. met de reden: ${banReason}\nActie door: ${adminIdentifier}${banEnd ? `\nEindigt op: ${banEnd}` : ''}`)
                .setColor('#ff0000')
                .setTimestamp()
            await sendDiscordEmbed(embed)
        } catch (webhookErr) {
            console.warn('Failed to send forum ban webhook:', webhookErr)
        }
        revalidatePath('/admin')
    } catch (error) {
        console.error(error)
    }
}
export async function unbanUserPlatform(userId: string) {
    const operator = await getUserFromSession()
    if (!operator || !(operator.role !== "admin")) {
        return { success: false, error: 'Unauthorized' }
    }
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
        // Send a notification to Discord
        try {
            let adminIdentifier = 'unknown'
            try {
                const admin = await getUserFromSession()
                if (admin) adminIdentifier = admin.name ?? admin.email ?? admin.id
            } catch { /* ignore */ }
            const embed = new Embed()
                .setTitle('Gebruiker niet meer verbannen')
                .setDescription(`De gebruiker met ID ${userId} is niet meer verbannen van het platform.\nActie door: ${adminIdentifier}`)
                .setColor('#00ff00')
                .setTimestamp()
            await sendDiscordEmbed(embed)
        } catch (webhookErr) {
            console.warn('Failed to send unban webhook:', webhookErr)
        }
        revalidatePath('/admin')
    } catch (error) {
        console.error(error)
    }
}
export async function unbanUserForum(userId: string) {
    const operator = await getUserFromSession()
    if (!operator || !(operator.role !== "admin")) {
        return { success: false, error: 'Unauthorized' }
    }
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
        // Send a notification to Discord
        try {
            let adminIdentifier = 'unknown'
            try {
                const admin = await getUserFromSession()
                if (admin) adminIdentifier = admin.name ?? admin.email ?? admin.id
            } catch { /* ignore */ }
            const embed = new Embed()
                .setTitle('Gebruiker niet meer verbannen van het forum')
                .setDescription(`De gebruiker met ID ${userId} is niet meer verbannen van het forum.\nActie door: ${adminIdentifier}`)
                .setColor('#00ff00')
                .setTimestamp()
            await sendDiscordEmbed(embed)
        } catch (webhookErr) {
            console.warn('Failed to send forum unban webhook:', webhookErr)
        }
        revalidatePath('/admin')
    } catch (error) {
        console.error(error)
    }
}
