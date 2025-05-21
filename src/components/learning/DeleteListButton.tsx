"use client";

import { useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { deleteListAction } from "@/serverActions/deleteList";
import { removeListFromGroup } from "@/serverActions/groupActions";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Button1 from "@/components/button/Button1";

interface DeleteListButtonProps {
    listId: string;
    isCreator: boolean;
    groupId?: string; // Optional groupId for removing lists from groups
    customText?: string; // Optional custom text for the list
}

export default function DeleteListButton({
    listId,
    isCreator,
    groupId,
    customText,

}: DeleteListButtonProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // If we're not the creator and not explicitly passing isCreator=true, don't show button
    if (!isCreator) {
        console.log("Not showing delete button for list:", listId);
        return null;
    }

    const handleDelete = useCallback(async () => {
        setIsDeleting(true);
        try {
            if (groupId) {
                // Remove list from group
                await removeListFromGroup(groupId, listId);
                router.refresh();
            } else {
                // Delete the list
                const result = await deleteListAction(listId);

                // Only redirect if we're on the view page of the list being deleted
                if (pathname.includes(`/learn/viewlist/${listId}`) ||
                    pathname.includes(`/learn/editlist/${listId}`)) {
                    router.push('/home/start');
                } else {
                    // Just refresh the current page without navigation to maintain scroll position
                    router.refresh();
                }
            }
        } catch (error) {
            console.error("Error deleting list:", error);
        } finally {
            setIsDeleting(false);
            setOpen(false);
        }
    }, [listId, router, pathname, groupId]);

    // Use event.stopPropagation to prevent triggering the link click when clicking the delete button
    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setOpen(true);
                }}
                className="text-red-400 h p-2 rounded  z-10"
                title="Verwijderen"
            >
                <div className="flex items-center justify-center">
                    {customText ? <span>{customText}</span> : null}
                    <Trash2 size={18} />
                </div>

            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] z-110">
                    <DialogHeader>
                        <DialogTitle>Bevestig verwijdering</DialogTitle>
                        <DialogDescription>
                            {groupId
                                ? "Weet je zeker dat je deze lijst uit de groep wilt verwijderen? Dit kan niet ongedaan gemaakt worden."
                                : "Weet je zeker dat je deze lijst wilt verwijderen? Dit kan niet ongedaan gemaakt worden."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button1
                            onClick={() => setOpen(false)}
                            text="Annuleren"
                        />
                        <Button1
                            onClick={handleDelete}
                            text={isDeleting ? "Bezig met verwijderen..." : "Verwijderen"}
                            disabled={isDeleting}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
