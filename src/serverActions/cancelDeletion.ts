"use server"

import { prisma } from "@/utils/prisma"
import { getUserFromSession } from "@/utils/auth/auth"

/**
 * Cancels a pending account deletion request
 * @returns Result object with success flag and message
 */
export async function cancelAccountDeletion() {
    try {
        const user = await getUserFromSession()
        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn om deze actie uit te voeren." }
        }

        // Check if there is a scheduled deletion
        if (!user.scheduledDeletion) {
            return { success: false, message: "Er is geen verwijderingsverzoek actief voor dit account." }
        }

        // Remove the scheduled deletion date
        let listData = user.list_data as any || {}
        if (listData.deletionRequested) {
            delete listData.deletionRequested
        }

        // Update the user to remove the deletion flag
        await prisma.user.update({
            where: { id: user.id },
            data: {
                scheduledDeletion: null,
                list_data: listData
            }
        })

        return {
            success: true,
            message: "Je verwijderingsverzoek is geannuleerd. Je account blijft actief."
        }
    } catch (error) {
        console.error("Error canceling account deletion:", error)
        return {
            success: false,
            message: "Er is een fout opgetreden bij het annuleren van je verwijderingsverzoek."
        }
    }
}
