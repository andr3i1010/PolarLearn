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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();

    if (!user) {
      return NextResponse.json({}, { status: 200 });
    }

    // Safe parse of notification data
    const notifications = safelyParseNotificationData(user.notificationData);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({}, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content, icon = "MessageSquare" } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { error: "Gebruiker ID en inhoud zijn verplicht" },
        { status: 400 }
      );
    }

    // Get the user's current notification data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationData: true }
    });

    // If user doesn't exist, throw an error
    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
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

    // Update user's notification data
    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationData: updatedData as Prisma.InputJsonValue
      }
    });

    return NextResponse.json(
      { success: true, message: "Notificatie succesvol verzonden" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Fout bij het verzenden van notificatie" },
      { status: 500 }
    );
  }
}
