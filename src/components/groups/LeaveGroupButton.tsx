"use client";

import { useState } from "react";
import Button1 from "@/components/button/Button1";
import { LogOut } from "lucide-react";
import { leaveGroup } from "@/serverActions/groupActions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface LeaveGroupButtonProps {
    groupId: string;
}

export default function LeaveGroupButton({ groupId }: LeaveGroupButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLeave = async () => {
        setIsLoading(true);
        try {
            const result = await leaveGroup(groupId);
            if (result.success) {
                toast.success(result.message || "Je hebt de groep verlaten");
                router.push("/learn/groups"); // Redirect to groups page after leaving
                router.refresh();
            } else {
                toast.error(result.error || "Er is een fout opgetreden");
            }
        } catch (error) {
            console.error("Error leaving group:", error);
            toast.error("Er is een fout opgetreden bij het verlaten van de groep.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button1
            text="Groep verlaten"
            icon={isLoading ? undefined : <LogOut size={14} />}
            onClick={handleLeave}
        />
    );
}
