"use client"

import { useState } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "../ui/dialog";
import { PlusIcon } from "lucide-react";
import { addListToGroup } from "@/serverActions/groupActions";
import { toast } from "react-toastify";

interface AddListToGroupButtonProps {
    groupId: string;
    listId: string;
    listName: string;
}

export default function AddListToGroupButton({
    groupId,
    listId,
    listName
}: AddListToGroupButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddList = async () => {
        setIsLoading(true);
        try {
            await addListToGroup(groupId, listId);
            toast.success(`Lijst "${listName}" toegevoegd aan de groep`, {
                position: "bottom-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            setIsOpen(false);
        } catch (error) {
            toast.error(`Fout bij het toevoegen van lijst: ${(error as Error).message}`, {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex gap-1 items-center"
                    onClick={() => setIsOpen(true)}
                >
                    <PlusIcon size={14} />
                    <span>Toevoegen</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lijst toevoegen aan groep</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p>Wil je de lijst "{listName}" toevoegen aan deze groep?</p>
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                    >
                        Annuleren
                    </Button>
                    <Button
                        onClick={handleAddList}
                        disabled={isLoading}
                    >
                        {isLoading ? "Toevoegen..." : "Toevoegen"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
