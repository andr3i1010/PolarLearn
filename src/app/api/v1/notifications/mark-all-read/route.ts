import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth/auth";
import { prisma } from "@/utils/prisma";
import { Prisma } from "@prisma/client";

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

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Niet ingelogd" },
        { status: 401 }
      );
    }

    // Get the user's current notification data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notificationData: true }
    });

    if (!userData) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Safely parse existing notifications
    const currentNotifications = safelyParseNotificationData(userData.notificationData);

    // Mark all notifications as read
    Object.keys(currentNotifications).forEach(key => {
      currentNotifications[key].read = true;
    });

    // Update user's notification data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        notificationData: currentNotifications as unknown as Prisma.InputJsonValue
      }
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Fout bij het markeren van alle notificaties" },
      { status: 500 }
    );
  }
}
