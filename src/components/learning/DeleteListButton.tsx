"use client";

import { useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { deleteListAction } from "@/serverActions/deleteList";

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
}

export default function DeleteListButton({
    listId,
    isCreator,
}: DeleteListButtonProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    if (!isCreator) {
        return null;
    }

    const handleDelete = useCallback(async () => {
        setIsDeleting(true);
        try {
            const result = await deleteListAction(listId);
            
            // Only redirect if we're on the view page of the list being deleted
            if (pathname.includes(`/learn/viewlist/${listId}`) || 
                pathname.includes(`/learn/editlist/${listId}`)) {
                router.push('/home/start');
            } else {
                // Just refresh the current page without navigation to maintain scroll position
                router.refresh();
            }
        } catch (error) {
            console.error("Error deleting list:", error);
            setIsDeleting(false);
            setOpen(false);
        }
    }, [listId, router, pathname]);

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
                <Trash2 size={18} />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] z-110">
                    <DialogHeader>
                        <DialogTitle>Bevestig verwijdering</DialogTitle>
                        <DialogDescription>
                            Weet je zeker dat je deze lijst wilt verwijderen? Dit kan niet ongedaan gemaakt worden.
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
