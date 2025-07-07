"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/utils/prisma"
import { getUserFromSession } from "@/utils/auth/auth"
import { z } from "zod"
import { hashPassword } from "@/utils/auth/user"
import * as crypto from "crypto"
// Import the entire module to ensure the TTL index setup runs on startup
import "@/utils/auth/userDeletion"
import { setupUserDeletionTTLIndex, getAccountDeletionDate } from "@/utils/auth/userDeletion"

/**
 * Updates the user's profile information
 */
export async function updateUserProfile(formData: FormData) {
    try {
        // Get the current user
        const user = await getUserFromSession()

        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn om je profiel te wijzigen." }
        }

        const username = formData.get("username") as string
        const email = formData.get("email") as string

        // Validate the inputs
        const profileSchema = z.object({
            username: z.string().min(3).max(20),
            email: z.string().email()
        })

        try {
            profileSchema.parse({ username, email })
        } catch (error) {
            return { success: false, message: "Ongeldige invoer. Controleer je gebruikersnaam en e-mailadres." }
        }

        // Check if the username is already taken by someone else
        if (username !== user.name) {
            const existingUserWithUsername = await prisma.user.findUnique({
                where: { name: username }
            })

            if (existingUserWithUsername) {
                return { success: false, message: "Deze gebruikersnaam is al in gebruik." }
            }
        }

        // Check if the email is already taken by someone else
        if (email !== user.email) {
            const existingUserWithEmail = await prisma.user.findUnique({
                where: { email }
            })

            if (existingUserWithEmail) {
                return { success: false, message: "Dit e-mailadres is al in gebruik." }
            }
        }

        // Update the user's information
        await prisma.user.update({
            where: { id: user.id },
            data: {
                name: username,
                email
            }
        })

        revalidatePath("/home/settings/account")
        return { success: true, message: "Je profiel is bijgewerkt." }
    } catch (error) {
        console.error("Error updating user profile:", error)
        return { success: false, message: "Er is een fout opgetreden bij het bijwerken van je profiel." }
    }
}

/**
 * Updates the user's password
 */
export async function updateUserPassword(formData: FormData) {
    try {
        const user = await getUserFromSession()
        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn om je wachtwoord te wijzigen." }
        }

        const currentPassword = formData.get("currentPassword") as string
        const newPassword = formData.get("newPassword") as string
        const confirmPassword = formData.get("confirmPassword") as string

        // Validate passwords
        if (!currentPassword || !newPassword || !confirmPassword) {
            return { success: false, message: "Alle velden zijn verplicht." }
        }

        if (newPassword !== confirmPassword) {
            return { success: false, message: "Nieuwe wachtwoorden komen niet overeen." }
        }

        if (newPassword.length < 8) {
            return { success: false, message: "Wachtwoord moet minimaal 8 tekens bevatten." }
        }

        // Check if current password is correct
        const hashedCurrentPassword = await hashPassword(currentPassword, user.salt)

        if (user.password !== hashedCurrentPassword) {
            return { success: false, message: "Huidig wachtwoord is onjuist." }
        }

        // Generate a new salt and hash the new password
        const salt = crypto.randomBytes(16).toString("base64")
        const hashedNewPassword = await hashPassword(newPassword, salt)

        // Update the user's password
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedNewPassword,
                salt
            }
        })

        return { success: true, message: "Wachtwoord succesvol bijgewerkt." }
    } catch (error) {
        console.error("Error updating user password:", error)
        return { success: false, message: "Er is een fout opgetreden bij het wijzigen van je wachtwoord." }
    }
}

/**
 * Updates user preferences
 */
export async function updateUserPreferences(preferences: {
    streakReminders?: boolean
    profileVisibility?: boolean
}) {
    try {
        const user = await getUserFromSession()
        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn om je voorkeuren te wijzigen." }
        }

        // Update user preferences in the list_data JSON field
        let listData = user.list_data as any || {}

        // Ensure the preferences object exists
        if (!listData.preferences) {
            listData.preferences = {}
        }

        // Update only the provided preferences
        if (preferences.streakReminders !== undefined) {
            listData.preferences.streakReminders = preferences.streakReminders
        }
        if (preferences.profileVisibility !== undefined) {
            listData.preferences.profileVisibility = preferences.profileVisibility
        }

        // Save the updated preferences
        await prisma.user.update({
            where: { id: user.id },
            data: {
                list_data: listData
            }
        })

        return { success: true, message: "Voorkeuren bijgewerkt." }
    } catch (error) {
        console.error("Error updating user preferences:", error)
        return { success: false, message: "Er is een fout opgetreden bij het bijwerken van je voorkeuren." }
    }
}

/**
 * Initiates account deletion process
 */
export async function initiateAccountDeletion(options?: { deleteLists?: boolean; deleteForumPosts?: boolean }) {
    try {
        const user = await getUserFromSession()
        const { deleteLists, deleteForumPosts } = options || {}
        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn om je account te verwijderen." }
        }

        // Ensure TTL index exists for automatic deletion
        await setupUserDeletionTTLIndex()

        // Calculate the deletion date (2 weeks from now)
        const deletionDate = await getAccountDeletionDate();

        // Mark the user for deletion and store flags
        let listData = user.list_data as any || {}
        listData.deletionRequested = new Date().toISOString()
        if (deleteLists) {
            listData.deleteLists = true
        }
        if (deleteForumPosts) {
            listData.deleteForumPosts = true
        }

        // Update the user with the scheduledDeletion date and flags
        await prisma.user.update({
            where: { id: user.id },
            data: {
                scheduledDeletion: deletionDate,
                list_data: listData
            }
        })

        // Update related practice lists and forum posts with scheduledDeletion
        if (deleteLists) {
            await prisma.practice.updateMany({ where: { creator: user.id }, data: { scheduledDeletion: deletionDate } });
        }
        if (deleteForumPosts) {
            await prisma.forum.updateMany({ where: { creator: user.id }, data: { scheduledDeletion: deletionDate } });
        }

        return {
            success: true,
            message: "Je verwijderingsverzoek is ontvangen. Je account wordt over 14 dagen verwijderd."
        }
    } catch (error) {
        console.error("Error initiating account deletion:", error)
        return {
            success: false,
            message: "Er is een fout opgetreden bij het verwerken van je verwijderingsverzoek."
        }
    }
}

/**
 * Cancels account deletion process
 */
export async function cancelAccountDeletion() {
    try {
        const user = await getUserFromSession()
        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn om je accountherstel te annuleren." }
        }

        // Clear deletion flags and dates
        // Copy and remove flags from list_data
        let listData = (user.list_data as any) || {}
        delete listData.deletionRequested
        delete listData.deleteLists
        delete listData.deleteForumPosts
        await prisma.user.update({
            where: { id: user.id },
            data: {
                scheduledDeletion: null,
                list_data: listData
            }
        })

        // Clear scheduledDeletion on related practice and forum
        await prisma.practice.updateMany({ where: { creator: user.id }, data: { scheduledDeletion: null } });
        await prisma.forum.updateMany({ where: { creator: user.id }, data: { scheduledDeletion: null } });

        return {
            success: true,
            message: "Je accountverwijdering is geannuleerd. Je accountgegevens zijn hersteld."
        }
    } catch (error) {
        console.error("Error canceling account deletion:", error)
        return {
            success: false,
            message: "Er is een fout opgetreden bij het annuleren van je accountverwijdering."
        }
    }
}

/**
 * Gets the current user's preferences
 */
export async function getUserPreferences() {
    try {
        const user = await getUserFromSession()
        if (!user) {
            return null
        }

        // Extract preferences from list_data
        const listData = (user.list_data as any) || {}
        const preferences = listData.preferences || {
            streakReminders: true,
            profileVisibility: true
        }

        return {
            id: user.id,
            username: user.name,
            email: user.email,
            scheduledDeletion: user.scheduledDeletion,
            preferences,
            profilePicture: user.image || null,
            
        }
    } catch (error) {
        console.error("Error getting user preferences:", error)
        return null
    }
}

/**
 * Gets the current user's bot account
 */
export async function getUserBotAccount() {
    try {
        const user = await getUserFromSession()
        if (!user) {
            return null
        }

        // Fetch the user's bot account from the database
        const botAccount = await prisma.bot.findFirst({
            where: { creatorId: user.id }
        })

        return botAccount
    } catch (error) {
        console.error("Error getting user bot account:", error)
        return null
    }
}

/**
 * Deletes the user's bot account
 */
export async function deleteUserBotAccount() {
    try {
        const user = await getUserFromSession()
        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn om je botaccount te verwijderen." }
        }

        const botAccount = await prisma.bot.findFirst({
            where: { creatorId: user.id }
        })

        if (!botAccount) {
            return { success: false, message: "Botaccount niet gevonden." }
        }

        await prisma.bot.delete({
            where: { id: botAccount.id }
        })

        return { success: true, message: "Botaccount verwijderd." }
    } catch (error) {
        console.error("Error deleting user bot account:", error)
        return { success: false, message: "Er is een fout opgetreden bij het verwijderen van je botaccount." }
    }
}

/**
 * make the user's bot account
 */
export async function createUserBotAccount(name: string,) {
    try {
        const user = await getUserFromSession()
        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn om een botaccount aan te maken." }
        }

        // Create a new bot account
        const botAccount = await prisma.bot.create({
            data: {
                creatorId: user.id,
                name: name,
                key: crypto.randomUUID(),
                token: crypto.randomUUID(),
            }
        })

        return { success: true, botAccount }
    } catch (error) {
        console.error("Error creating user bot account:", error)
        return { success: false, message: "Er is een fout opgetreden bij het aanmaken van je botaccount." }
    }
}
