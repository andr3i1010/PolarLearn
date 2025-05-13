"use client"

import { useState, useEffect } from "react";
import { getPendingApprovals, handleMembershipRequest } from "@/serverActions/groupActions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Jdenticon from "@/components/Jdenticon";
import { Check, X, Loader2 } from "lucide-react";
import Button1 from "@/components/button/Button1";

interface PendingApprovalsProps {
    groupId: string;
}

interface PendingMember {
    id: string;
    name: string | null;
    image: string | null;
}

export default function PendingApprovals({ groupId }: PendingApprovalsProps) {
    const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
    const router = useRouter();

    // Fetch pending approvals
    useEffect(() => {
        const fetchApprovals = async () => {
            try {
                setLoading(true);
                const result = await getPendingApprovals(groupId);

                if (result.success && result.pendingApprovals) {
                    setPendingMembers(result.pendingApprovals);
                } else if (!result.success) {
                    toast.error(result.error || "Kon verzoeken niet laden");
                }
            } catch (error) {
                console.error("Error fetching approvals:", error);
                toast.error("Er is een fout opgetreden bij het laden van de verzoeken");
            } finally {
                setLoading(false);
            }
        };

        fetchApprovals();
    }, [groupId]);

    // Handle approval/rejection
    const handleRequest = async (userId: string, approved: boolean) => {
        try {
            // Mark this user as being processed
            setProcessingIds(prev => ({ ...prev, [userId]: true }));

            const result = await handleMembershipRequest(groupId, userId, approved);

            if (result.success) {
                // Remove from pending list
                setPendingMembers(prev => prev.filter(member => member.id !== userId));
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error || "Kon verzoek niet verwerken");
            }
        } catch (error) {
            console.error("Error handling request:", error);
            toast.error("Er is een fout opgetreden");
        } finally {
            // Clear processing state
            setProcessingIds(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (pendingMembers.length === 0) {
        return (
            <div className="text-gray-400 text-center p-6">
                Er zijn geen openstaande verzoeken.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Verzoeken om lid te worden</h3>
            <div className="space-y-3">
                {pendingMembers.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center justify-between bg-neutral-800 rounded-lg p-4 border border-neutral-700"
                    >
                        <div className="flex items-center">
                            <div className="mr-3">
                                {member.image ? (
                                    <Image
                                        src={member.image}
                                        alt={`Avatar van ${member.name || 'gebruiker'}`}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                    />
                                ) : (
                                    <Jdenticon value={member.name || member.id} size={40} />
                                )}
                            </div>
                            <div>
                                <div className="font-medium">{member.name || "Onbekende gebruiker"}</div>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button1
                                onClick={() => handleRequest(member.id, true)}
                                text={processingIds[member.id] ? "Bezig..." : "Accepteren"}
                                icon={processingIds[member.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                disabled={!!processingIds[member.id]}
                                aria-label="Accepteren"
                            />
                            <Button1
                                onClick={() => handleRequest(member.id, false)}
                                text={processingIds[member.id] ? "Bezig..." : "Afwijzen"}
                                icon={processingIds[member.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                                disabled={!!processingIds[member.id]}
                                aria-label="Afwijzen"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
