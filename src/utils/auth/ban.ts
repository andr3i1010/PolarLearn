"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { Embed, Webhook } from '@vermaysha/discord-webhook'
const hook = new Webhook(process.env.DISCORD_WEBHOOK || '')

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
        await prisma.session.deleteMany({
            where: {
                userId: userId
            }
        })
                // Send a notification to Discord
        const embed = new Embed()
            .setTitle('Gebruiker verbannen')
            .setDescription(`De gebruiker met ID ${userId} is verbannen van het platform. met de reden: ${banReason}`)
            .setColor('#ff0000')
            .setTimestamp()
            .setUrl(`${process.env.NEXT_PUBLIC_URL}/home/viewuser/${userId}`)
            .setFooter({
                text: 'Van ' + process.env.NEXT_PUBLIC_URL,
            })
        hook.addEmbed(embed)
        hook.send()
        revalidatePath('/admin')
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
                // Send a notification to Discord
        const embed = new Embed()
            .setTitle('Gebruiker verbannen van het forum')
            .setDescription(`De gebruiker met ID ${userId} is verbannen van het forum. met de reden: ${banReason}`)
            .setColor('#ff0000')
            .setTimestamp()
            .setUrl(`${process.env.NEXT_PUBLIC_URL}/home/viewuser/${userId}`)
            .setFooter({
                text: 'Van ' + process.env.NEXT_PUBLIC_URL,
            })
        hook.addEmbed(embed)
        hook.send()
        revalidatePath('/admin')
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
        // Send a notification to Discord
        const embed = new Embed()
            .setTitle('Gebruiker niet meer verbannen')
            .setDescription(`De gebruiker met ID ${userId} is niet meer verbannen van het platform.`)
            .setColor('#00ff00')
            .setTimestamp()
            .setUrl(`${process.env.NEXT_PUBLIC_URL}/home/viewuser/${userId}`)
            .setFooter({
                text: 'Van ' + process.env.NEXT_PUBLIC_URL,
            })
        hook.addEmbed(embed)
        hook.send()
        revalidatePath('/admin')
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
        // Send a notification to Discord
        const embed = new Embed()
            .setTitle('Gebruiker niet meer verbannen van het forum')
            .setDescription(`De gebruiker met ID ${userId} is niet meer verbannen van het forum.`)
            .setColor('#00ff00')
            .setTimestamp()
            .setUrl(`${process.env.NEXT_PUBLIC_URL}/home/viewuser/${userId}`)
            .setFooter({
                text: 'Van ' + process.env.NEXT_PUBLIC_URL,
            })
        hook.addEmbed(embed)
        hook.send()
        revalidatePath('/admin')
    } catch (error) {
        console.error(error)
    }
}