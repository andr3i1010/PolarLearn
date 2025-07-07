'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/utils/prisma'
import { Embed, Webhook } from '@vermaysha/discord-webhook'

const hook = new Webhook(process.env.DISCORD_WEBHOOK || '')

export async function getAdminSettings() {
    try {
        const settings = await prisma.config.findMany({
            where: {
                key: {
                    in: ['forum_enabled', 'registration_enabled']
                }
            }
        })

        const settingsMap = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value === 'true'
            return acc
        }, {} as Record<string, boolean>)

        return {
            forumEnabled: settingsMap.forum_enabled ?? true,
            registrationEnabled: settingsMap.registration_enabled ?? true,
        }
    } catch (error) {
        console.error('Error fetching admin settings:', error)
        throw new Error('Failed to fetch settings')
    }
}

export async function updateAdminSettings(formData: FormData) {
    try {
        const forumEnabled = formData.get('forumEnabled') === 'on'
        const registrationEnabled = formData.get('registrationEnabled') === 'on'
        const oldSettings = await getAdminSettings()

        // Update or create forum_enabled setting
        await prisma.config.upsert({
            where: { key: 'forum_enabled' },
            update: { value: forumEnabled.toString() },
            create: {
                key: 'forum_enabled',
                value: forumEnabled.toString()
            }
        })

        // Update or create registration_enabled setting
        await prisma.config.upsert({
            where: { key: 'registration_enabled' },
            update: { value: registrationEnabled.toString() },
            create: {
                key: 'registration_enabled',
                value: registrationEnabled.toString()
            }
        })
        const embed = new Embed()
            .setTitle('Polarlearn Instellingen Bijgewerkt')
            .setDescription(`Forum: ${forumEnabled ? 'aan' : 'uit'}\nRegistraties: ${registrationEnabled ? 'aan' : 'uit'}`)
            .setColor('#0099ff')
            .setTimestamp()
            .setFooter({
            text: 'Van ' + process.env.NEXT_PUBLIC_URL,
            })
        
        hook.addEmbed(embed)
        await hook.send()

        revalidatePath('/admin')

        return { success: true, message: 'Instellingen succesvol opgeslagen' }
    } catch (error) {
        console.error('Error updating admin settings:', error)
        throw new Error('Failed to update settings')
    }
}
