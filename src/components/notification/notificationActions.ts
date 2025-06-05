"use server"

import { getUserFromSession } from "@/utils/auth/auth"
import { cookies } from "next/headers"
import { prisma } from "@/utils/prisma"
import { Prisma } from "@prisma/client"

// Define notification item type
interface NotificationItem {
    icon: string;
    content: string;
    read: boolean;
    createdAt?: string;
}

interface NotificationData {
    [key: string]: NotificationItem;
}

// Helper function to safely convert JSON to NotificationData
function safelyParseNotificationData(data: any): NotificationData {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {};
    }

    // Return data as NotificationData, assuming it has the right structure
    return data as NotificationData;
}

export async function getAllNotifs() {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get("polarlearn.session-id")?.value;

        if (!sessionId) {
            console.log("No session ID found, returning empty notifications");
            return {};
        }

        const user = await getUserFromSession(sessionId);
        if (!user) {
            console.log("No user found for session, returning empty notifications");
            return {};
        }

        // Safe parse of notification data
        return safelyParseNotificationData(user.notificationData);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return {};
    }
}

export async function sendUserNotification(toUserId: string, content: string, icon: string = "MessageSquare", includeSenderName: boolean = true) {
    try {
        // Verify the current user is logged in
        const cookieStore = await cookies();
        const sessionId = cookieStore.get("polarlearn.session-id")?.value;

        if (!sessionId) {
            return { success: false, message: "Je moet ingelogd zijn om berichten te sturen" };
        }

        const currentUser = await getUserFromSession(sessionId);
        if (!currentUser) {
            return { success: false, message: "Je moet ingelogd zijn om berichten te sturen" };
        }

        // Only admins can customize icons, otherwise default to MessageSquare
        if (currentUser.role !== "admin" && icon !== "MessageSquare") {
            icon = "MessageSquare";
        }

        // Get the target user
        const targetUser = await prisma.user.findUnique({
            where: { id: toUserId },
            select: { notificationData: true, name: true }
        });

        if (!targetUser) {
            return { success: false, message: "Gebruiker niet gevonden" };
        }

        // Safely parse existing notifications
        const currentNotifications = safelyParseNotificationData(targetUser.notificationData);

        // Add sender info to the message if not sending to self and includeSenderName is true
        const messagePrefix = (currentUser.id !== toUserId && includeSenderName)
            ? `${currentUser.name}: `
            : "";

        // Create a timestamp to use as unique key
        const timestamp = Date.now().toString();

        // Create new notification - this needs to be a valid JSON object for Prisma
        const newNotification = {
            icon,
            content: messagePrefix + content,
            read: false,
            createdAt: new Date().toISOString()
        };

        // Create the updated data as a plain JSON object that Prisma can store
        const updatedData = {
            ...currentNotifications,
            [timestamp]: newNotification
        };

        // Update user's notification data - use "as any" to bypass the type check
        // This is safe because we know our object is a valid JSON structure
        await prisma.user.update({
            where: { id: toUserId },
            data: {
                notificationData: updatedData as any
            }
        });

        return { success: true, message: "Bericht verzonden" };
    } catch (error) {
        console.error("Error sending notification:", error);
        return { success: false, message: "Er ging iets mis bij het verzenden" };
    }
}

export async function markNotificationsAsRead() {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get("polarlearn.session-id")?.value;

        if (!sessionId) {
            return { success: false, message: "Je moet ingelogd zijn" };
        }

        const user = await getUserFromSession(sessionId);
        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn" };
        }

        // Get current notifications
        const notificationData = safelyParseNotificationData(user.notificationData);

        if (Object.keys(notificationData).length === 0) {
            return { success: true, message: "Geen meldingen om te markeren" };
        }

        // Create a copy and mark all as read
        const updatedNotifications = { ...notificationData };

        let changed = false;
        for (const key in updatedNotifications) {
            if (!updatedNotifications[key].read) {
                updatedNotifications[key].read = true;
                changed = true;
            }
        }

        if (!changed) {
            return { success: true, message: "Alle meldingen waren al gelezen" };
        }

        // Update in database with proper type handling
        await prisma.user.update({
            where: { id: user.id },
            data: {
                notificationData: updatedNotifications as any
            }
        });

        return { success: true, message: "Alle meldingen gemarkeerd als gelezen" };
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return { success: false, message: "Er ging iets mis" };
    }
}

// Add a new function to delete a specific notification
export async function deleteNotification(notificationKey: string) {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get("polarlearn.session-id")?.value;

        if (!sessionId) {
            return { success: false, message: "Je moet ingelogd zijn" };
        }

        const user = await getUserFromSession(sessionId);
        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn" };
        }

        // Get current notifications
        const notificationData = safelyParseNotificationData(user.notificationData);

        // Check if notification exists
        if (!notificationData[notificationKey]) {
            return { success: false, message: "Notificatie niet gevonden" };
        }

        // Create a copy and delete the notification
        const updatedNotifications = { ...notificationData };
        delete updatedNotifications[notificationKey];

        // Update in database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                notificationData: updatedNotifications as any
            }
        });

        return { success: true, message: "Notificatie verwijderd" };
    } catch (error) {
        console.error("Error deleting notification:", error);
        return { success: false, message: "Er ging iets mis" };
    }
}

// Add a function to mark a single notification as read
export async function markNotificationAsRead(notificationKey: string) {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get("polarlearn.session-id")?.value;

        if (!sessionId) {
            return { success: false, message: "Je moet ingelogd zijn" };
        }

        const user = await getUserFromSession(sessionId);
        if (!user) {
            return { success: false, message: "Je moet ingelogd zijn" };
        }

        // Get current notifications
        const notificationData = safelyParseNotificationData(user.notificationData);

        // Check if notification exists and is not already read
        if (!notificationData[notificationKey]) {
            return { success: false, message: "Notificatie niet gevonden" };
        }

        if (notificationData[notificationKey].read) {
            return { success: true, message: "Notificatie was al gelezen" };
        }

        // Create a copy and mark as read
        const updatedNotifications = { ...notificationData };
        updatedNotifications[notificationKey].read = true;

        // Update in database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                notificationData: updatedNotifications as any
            }
        });

        return { success: true, message: "Notificatie gemarkeerd als gelezen" };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, message: "Er ging iets mis" };
    }
}