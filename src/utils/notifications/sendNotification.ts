"use server"

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

export async function sendNotificationToUser(userId: string, content: string, icon: string = "MessageSquare") {
    try {
        // Get the user's current notification data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { notificationData: true }
        });

        // If user doesn't exist, throw an error
        if (!user) {
            throw new Error("User not found");
        }

        // Safely parse existing notifications
        const currentNotifications = safelyParseNotificationData(user.notificationData);

        // Create a timestamp to use as unique key
        const timestamp = Date.now().toString();

        // Create the new notification object
        const newNotification = {
            icon,
            content,
            read: false,
            createdAt: new Date().toISOString()
        };

        // Create the updated data object
        const updatedData = {
            ...currentNotifications,
            [timestamp]: newNotification
        };

        // Update user's notification data with proper Prisma type
        await prisma.user.update({
            where: { id: userId },
            data: {
                notificationData: updatedData as Prisma.InputJsonValue
            }
        });

        return { success: true, message: "Notification sent successfully" };
    } catch (error) {
        console.error("Error sending notification:", error);
        return { success: false, message: "Failed to send notification" };
    }
}
