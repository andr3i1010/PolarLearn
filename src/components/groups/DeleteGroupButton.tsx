"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash, Loader2 } from "lucide-react";
import { deleteGroup } from "@/serverActions/groupActions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

interface DeleteGroupButtonProps {
    groupId: string;
}

export default function DeleteGroupButton({ groupId }: DeleteGroupButtonProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteGroup(groupId);

            if (result.success) {
                toast.success("Groep succesvol verwijderd");
                // Redirect to home page
                router.push("/home/start");
            } else {
                toast.error(result.error || "Er is een fout opgetreden bij het verwijderen van de groep");
                setIsConfirmOpen(false);
            }
        } catch (error) {
            console.error("Error deleting group:", error);
            toast.error("Er is een fout opgetreden bij het verwijderen van de groep");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                variant="destructive"
                className="bg-red-700 hover:bg-red-800 text-white"
                onClick={() => setIsConfirmOpen(true)}
            >
                <Trash className="mr-2 h-4 w-4" />
                Groep verwijderen
            </Button>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="bg-neutral-900 border-neutral-700 text-white z-[110]">
                    <DialogHeader>
                        <DialogTitle>Groep verwijderen</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Weet je zeker dat je deze groep wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsConfirmOpen(false)}
                            className="border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700"
                            disabled={isDeleting}
                        >
                            Annuleren
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-700 hover:bg-red-800"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verwijderen...
                                </>
                            ) : (
                                <>
                                    <Trash className="mr-2 h-4 w-4" />
                                    Verwijderen
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
