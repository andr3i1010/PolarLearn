"use client"

import { useState } from "react";
import Button1 from "@/components/button/Button1";
import { UserPlus, Loader2 } from "lucide-react";
import { joinGroup } from "@/serverActions/groupActions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface JoinGroupButtonProps {
    groupId: string;
    requiresApproval?: boolean;
}

export default function JoinGroupButton({ groupId, requiresApproval = false }: JoinGroupButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleJoin = async () => {
        setIsLoading(true);
        try {
            const result = await joinGroup(groupId);

            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error || "Er is een fout opgetreden");
            }
        } catch (error) {
            console.error("Error joining group:", error);
            toast.error("Er is een fout opgetreden");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button1
            onClick={handleJoin}
            disabled={isLoading}
            text={
                isLoading
                    ? (requiresApproval ? "Verzoek verzenden..." : "Lid worden...")
                    : (requiresApproval ? "Lidmaatschap aanvragen" : "Lid worden")
            }
            icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-5 w-5" />}
        />
    );
}
