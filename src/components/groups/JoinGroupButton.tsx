"use client"

import { useState, useEffect } from "react";
import Button1 from "@/components/button/Button1";
import { UserPlus, Clock, Loader2 } from "lucide-react";
import { joinGroup } from "@/serverActions/groupActions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface JoinGroupButtonProps {
    groupId: string;
    requiresApproval?: boolean;
    hasPendingRequest?: boolean;
}

export default function JoinGroupButton({
    groupId,
    requiresApproval = false,
    hasPendingRequest = false
}: JoinGroupButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, setIsPending] = useState(hasPendingRequest);
    const router = useRouter();

    // If hasPendingRequest is not provided from the server, we can check on the client side
    useEffect(() => {
        if (hasPendingRequest) {
            setIsPending(true);
        }
    }, [hasPendingRequest]);

    const handleJoin = async () => {
        if (isPending) return;

        setIsLoading(true);
        try {
            const result = await joinGroup(groupId);

            if (result.success) {
                toast.success(result.message);
                if (requiresApproval) {
                    setIsPending(true);
                }
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

    if (isPending) {
        return (
            <Button1
                onClick={() => { }}
                disabled={true}
                text="Verzoek in behandeling"
                icon={<Clock className="h-5 w-5" />}
            />
        );
    }

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
