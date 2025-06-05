import { Bell, BellDot, Check, Trash2 } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import Button1 from "../button/Button1";
import { useEffect, useState } from "react";
import {
    getAllNotifs,
    markNotificationsAsRead,
    deleteNotification as deleteNotificationAction,
    markNotificationAsRead
} from "./notificationActions";
import React from "react";
import * as LucideIcons from "lucide-react";
import { LucideProps } from "lucide-react";

// Define proper type based on the schema example
interface NotificationItem {
    icon: string; // name of the lucide icon
    content: string;
    read: boolean;
}

interface NotificationData {
    [key: string]: NotificationItem;
}

// Helper function to validate the shape of notification data
function isValidNotificationData(data: unknown): data is NotificationData {
    if (!data || typeof data !== 'object') return false;

    // Check if every key points to a valid notification item
    return Object.entries(data).every(([_, value]) => {
        return (
            value &&
            typeof value === 'object' &&
            'icon' in value &&
            'content' in value &&
            'read' in value
        );
    });
}

// Type for Lucide icon components
type IconComponent = React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

export default function NotificationNav() {
    const [notifications, setNotifications] = useState<NotificationData | null>(null);
    const [readAll, setReadAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await getAllNotifs();

                // Validate the response data
                if (isValidNotificationData(response)) {
                    setNotifications(response);

                    // Set readAll based on notification status
                    if (Object.keys(response).length === 0) {
                        setReadAll(true);
                    } else {
                        const allRead = Object.values(response).every(notif => notif && notif.read === true);
                        setReadAll(allRead);
                    }
                } else {
                    console.error("Invalid notification data format:", response);
                    setNotifications(null);
                    setReadAll(true);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
                setError("Kon meldingen niet laden");
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    // Function to mark all notifications as read
    const markAllAsRead = async () => {
        if (!notifications) return;

        try {
            const result = await markNotificationsAsRead();

            if (result.success) {
                // Update local state
                const updatedNotifications = { ...notifications };
                Object.keys(updatedNotifications).forEach(key => {
                    if (updatedNotifications[key]) {
                        updatedNotifications[key].read = true;
                    }
                });

                setNotifications(updatedNotifications);
                setReadAll(true);
            } else {
                console.error("Failed to mark notifications as read:", result.message);
            }
        } catch (error) {
            console.error("Error marking notifications as read:", error);
        }
    };

    // New function to delete a notification
    const deleteNotification = async (key: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the notification click

        if (!notifications) return;

        try {
            const result = await deleteNotificationAction(key);

            if (result.success) {
                const updatedNotifications = { ...notifications };
                delete updatedNotifications[key];

                setNotifications(updatedNotifications);

                if (Object.keys(updatedNotifications).length === 0) {
                    setReadAll(true);
                }
            } else {
                console.error("Failed to delete notification:", result.message);
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    // New function to mark a notification as read
    const markAsRead = async (key: string) => {
        if (!notifications || notifications[key].read) return;

        try {
            const result = await markNotificationAsRead(key);

            if (result.success) {
                const updatedNotifications = { ...notifications };
                updatedNotifications[key].read = true;

                setNotifications(updatedNotifications);

                // Check if all notifications are now read
                const allRead = Object.values(updatedNotifications).every(notif => notif.read);
                if (allRead) {
                    setReadAll(true);
                }
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    // Improved icon rendering with proper TypeScript support
    const renderIcon = (iconName: string) => {
        // Try to find the icon component by name
        const iconMap: Record<string, IconComponent> = {
            Bell: LucideIcons.Bell,
            BellDot: LucideIcons.BellDot,
            Check: LucideIcons.Check,
            AlertCircle: LucideIcons.AlertCircle,
            Info: LucideIcons.Info,
            MessageSquare: LucideIcons.MessageSquare,
            Mail: LucideIcons.Mail,
            Calendar: LucideIcons.Calendar,
            User: LucideIcons.User,
            Users: LucideIcons.Users,
            Award: LucideIcons.Award,
            Star: LucideIcons.Star,
            Trash: LucideIcons.Trash,
            Trash2: LucideIcons.Trash2,
            // Add more icons as needed
        };

        // Get the icon component or use Bell as fallback, with increased size
        const IconComponent = iconMap[iconName] || LucideIcons.Bell;
        return <IconComponent className="w-6 h-6 mr-3" />;
    };

    // Calculate unread notifications count
    const unreadCount = notifications ? Object.values(notifications).filter(notif => !notif.read).length : 0;

    return (
        <Popover>
            <PopoverTrigger>
                <div className="relative w-10 h-10 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full flex items-center transition-all justify-center">
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="min-w-100 bg-neutral-800 z-110 drop-shadow-2xl min-h-40 flex flex-col space-y-3 text-white">
                <div className="flex flex-row items-center justify-center ">
                    <Bell className="w-6 h-6 mr-3" />
                    <h1 className="text-2xl font-extrabold pr-3">Meldingen</h1>
                    <Button1
                        text={`${readAll ? "Alles gelezen" : "Alles lezen"}`}
                        icon={readAll ? <Check /> : <BellDot />}
                        onClick={markAllAsRead}
                        disabled={readAll}
                    />
                </div>
                <hr className="border-neutral-700" />
                {loading ? (
                    <div className="text-center py-2">Notifications laden...</div>
                ) : error ? (
                    <div className="text-center py-2 text-red-400">{error}</div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {notifications && Object.keys(notifications).length > 0 ? (
                            Object.entries(notifications).map(([key, notification]) => (
                                <div key={key}
                                    className={`p-3 flex items-center justify-between ${notification.read ? 'text-gray-400' : 'text-white font-medium'} hover:bg-neutral-700 rounded-md transition-colors group cursor-pointer`}
                                    onClick={() => markAsRead(key)}>
                                    <div className="flex items-center flex-1">
                                        {notification.icon && renderIcon(notification.icon)}
                                        <span className="flex-1">{notification.content}</span>
                                        {!notification.read && (
                                            <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => deleteNotification(key, e)}
                                        className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Delete notification"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-2 text-neutral-500">Je hebt geen meldingen..</div>
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}