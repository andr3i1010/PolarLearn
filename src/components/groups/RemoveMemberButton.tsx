"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Button1 from "@/components/button/Button1";
import { removeMemberFromGroup } from "@/serverActions/groupActions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface RemoveMemberButtonProps {
    groupId: string;
    memberId: string;
    memberName: string;
}

export default function RemoveMemberButton({ groupId, memberId, memberName }: RemoveMemberButtonProps) {
    const [open, setOpen] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const router = useRouter();

    const handleRemove = async () => {
        setIsRemoving(true);
        try {
            const response = await removeMemberFromGroup(groupId, memberId);
            if (response.success) {
                toast.success("Lid is verwijderd uit de groep");
                setOpen(false);
                router.refresh();
            } else {
                toast.error(response.error || "Er is een fout opgetreden bij het verwijderen van het lid");
            }
        } catch (error) {
            console.error("Error removing member:", error);
            toast.error("Er is een fout opgetreden bij het verwijderen van het lid");
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <>
            <button
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
                onClick={() => setOpen(true)}
            >
                Verwijderen
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] z-110">
                    <DialogHeader>
                        <DialogTitle>Lid verwijderen</DialogTitle>
                        <DialogDescription>
                            Weet je zeker dat je {memberName} wilt verwijderen uit deze groep?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button1
                            onClick={() => setOpen(false)}
                            text="Annuleren"
                        />
                        <Button1
                            onClick={handleRemove}
                            text={isRemoving ? "Bezig met verwijderen..." : "Verwijderen"}
                            disabled={isRemoving}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
