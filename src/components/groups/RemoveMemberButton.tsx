"use client"

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { removeMemberFromGroup } from "@/serverActions/groupActions";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface RemoveMemberButtonProps {
    groupId: string;
    memberId: string;
    memberName: string;
}

export default function RemoveMemberButton({ groupId, memberId, memberName }: RemoveMemberButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleRemove = async () => {
        setIsLoading(true);
        try {
            const result = await removeMemberFromGroup(groupId, memberId);

            if (result.success) {
                toast.success(result.message || "Lid verwijderd");
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Er is een fout opgetreden");
            }
        } catch (error) {
            console.error("Error removing member:", error);
            toast.error("Er is een fout opgetreden");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                    Verwijderen
                </button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
                <DialogHeader>
                    <DialogTitle>Lid verwijderen</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Weet je zeker dat je <span className="text-white">{memberName}</span> uit deze groep wilt verwijderen?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="mr-2 bg-transparent hover:bg-neutral-800"
                        disabled={isLoading}
                    >
                        Annuleren
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleRemove}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verwijderen...
                            </>
                        ) : (
                            "Verwijderen"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
