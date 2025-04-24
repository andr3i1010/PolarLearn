"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { approveGroupMember, denyGroupMember } from "@/serverActions/groupActions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface MemberApprovalButtonProps {
    groupId: string;
    memberId: string;
}

export default function MemberApprovalButton({ groupId, memberId }: MemberApprovalButtonProps) {
    const [isLoading, setIsLoading] = useState<{ approve: boolean, deny: boolean }>({
        approve: false,
        deny: false
    });
    const router = useRouter();

    const handleApprove = async () => {
        setIsLoading({ ...isLoading, approve: true });
        try {
            const result = await approveGroupMember(groupId, memberId);

            if (result.success) {
                toast.success(result.message || "Lid goedgekeurd");
                router.refresh();
            } else {
                toast.error(result.error || "Er is een fout opgetreden");
            }
        } catch (error) {
            console.error("Error approving member:", error);
            toast.error("Er is een fout opgetreden");
        } finally {
            setIsLoading({ ...isLoading, approve: false });
        }
    };

    const handleDeny = async () => {
        setIsLoading({ ...isLoading, deny: true });
        try {
            const result = await denyGroupMember(groupId, memberId);

            if (result.success) {
                toast.success(result.message || "Lidverzoek geweigerd");
                router.refresh();
            } else {
                toast.error(result.error || "Er is een fout opgetreden");
            }
        } catch (error) {
            console.error("Error denying member:", error);
            toast.error("Er is een fout opgetreden");
        } finally {
            setIsLoading({ ...isLoading, deny: false });
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="bg-green-600/20 text-green-500 border border-green-600/50 hover:bg-green-700/20"
                onClick={handleApprove}
                disabled={isLoading.approve || isLoading.deny}
            >
                {isLoading.approve ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                    <Check className="h-4 w-4 mr-1" />
                )}
                Goedkeuren
            </Button>

            <Button
                variant="outline"
                size="sm"
                className="bg-red-600/20 text-red-500 border border-red-600/50 hover:bg-red-700/20"
                onClick={handleDeny}
                disabled={isLoading.approve || isLoading.deny}
            >
                {isLoading.deny ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                    <X className="h-4 w-4 mr-1" />
                )}
                Weigeren
            </Button>
        </>
    );
}
