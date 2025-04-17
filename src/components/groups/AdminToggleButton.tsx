"use client"

import { useState } from "react";
import Button1 from "@/components/button/Button1";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { toggleMemberAdminStatus } from "@/serverActions/groupActions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface AdminToggleButtonProps {
    groupId: string;
    memberId: string;
    isAdmin: boolean;
}

export default function AdminToggleButton({ groupId, memberId, isAdmin }: AdminToggleButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            const result = await toggleMemberAdminStatus(groupId, memberId);

            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error || "Er is een fout opgetreden");
            }
        } catch (error) {
            console.error("Error toggling admin status:", error);
            toast.error("Er is een fout opgetreden");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button1
            onClick={handleToggle}
            disabled={isLoading}
            text={isAdmin ? "Beheerder verwijderen" : "Beheerder maken"}
            icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAdmin ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />)}
        />
    );
}
