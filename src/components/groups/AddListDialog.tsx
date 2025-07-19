"use client"

import { useState, useCallback, useEffect, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { PlusIcon, SearchIcon, Loader2, XCircleIcon, AlertCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button1 from "../button/Button1";
import { getSubjectIcon } from "@/components/icons";

interface List {
    list_id: string;
    name: string;
    subject: string;
    data: any;
    creator: string;
    published: boolean;
    mode?: string;
}

interface AddListDialogProps {
    groupId: string;
    children: ReactNode;
    initialLists: List[];
}

export default function AddListDialog({ groupId, children, initialLists }: AddListDialogProps) {
    const [open, setOpen] = useState(false);
    const [availableLists, setAvailableLists] = useState<List[]>(initialLists);
    const [filteredLists, setFilteredLists] = useState<List[]>(initialLists);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Initialize lists when dialog opens
    useEffect(() => {
        if (open) {
            setAvailableLists(initialLists);
            setFilteredLists(initialLists);
            if (initialLists.length === 0) {
                setError("Geen lijsten beschikbaar om toe te voegen aan deze groep.");
            }
        }
    }, [open, initialLists]);

    // Handle dialog open/close
    const handleOpenChange = useCallback((isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setSearchTerm("");
            setFilteredLists([]);
            setError(null);
        }
    }, []);

    // Filter lists based on search term
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (term.trim() === "") {
            setFilteredLists(availableLists);
        } else {
            const filtered = availableLists.filter(list =>
                list.name.toLowerCase().includes(term.toLowerCase())
            );
            setFilteredLists(filtered);
        }
    }, [availableLists]);

    const handleAddList = async (listId: string) => {
        setIsSubmitting(listId);
        try {
            // Call API endpoint to add list to group
            const res = await fetch(`/api/v1/groups/${groupId}/lists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listId }),
            });
            if (!res.ok) throw new Error(await res.text());

            toast.success("Lijst succesvol toegevoegd!");

            // Remove this list from the available lists
            setAvailableLists(prev => prev.filter(list => list.list_id !== listId));
            setFilteredLists(prev => prev.filter(list => list.list_id !== listId));

            // Close dialog if no lists left
            if (availableLists.length <= 1) {
                setOpen(false);
            }

            router.refresh(); // Refresh to show the new list
        } catch (error) {
            console.error("Error adding list to group:", error);
            toast.error("Er is een fout opgetreden bij het toevoegen van de lijst.");
        } finally {
            setIsSubmitting(null);
        }
    };

    const handleCreateNewList = () => {
        setOpen(false);
        router.push('/learn/createlist');
    };

    // Get word count for display
    const getWordCount = (data: any, mode?: string) => {
        // Don't show word count for summaries
        if (mode === "summary") {
            return null;
        }
        if (Array.isArray(data)) {
            return data.length === 1 ? "1 woord" : `${data.length} woorden`;
        }
        return "0 woorden";
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {children}
            </div>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-neutral-900 border-neutral-700 text-white z-[1000]">
                    <DialogHeader>
                        <DialogTitle>Lijst toevoegen aan groep</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Selecteer een lijst die je wilt toevoegen aan deze groep.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search box */}
                    <div className="relative mt-2">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                        <Input
                            placeholder="Zoek lijsten..."
                            className="pl-9 bg-neutral-800 border-neutral-700 text-white"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* List content */}
                    <div className="mt-4 space-y-2">
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-2" />
                                <p className="text-neutral-400">Lijsten laden...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 text-neutral-400 flex flex-col items-center">
                                <AlertCircleIcon className="h-8 w-8 mb-2 text-yellow-500" />
                                <p>{error}</p>
                                <Button
                                    onClick={handleCreateNewList}
                                    className="mt-4 bg-sky-600 hover:bg-sky-700"
                                >
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Nieuwe lijst maken
                                </Button>
                            </div>
                        ) : filteredLists.length === 0 ? (
                            <div className="text-center py-8 text-neutral-400 flex flex-col items-center">
                                <XCircleIcon className="h-8 w-8 mb-2 text-neutral-500" />
                                {searchTerm
                                    ? "Geen lijsten gevonden die aan je zoekopdracht voldoen."
                                    : "Je hebt nog geen lijsten die je kunt toevoegen."}
                                <Button
                                    onClick={handleCreateNewList}
                                    className="mt-4 bg-sky-600 hover:bg-sky-700"
                                >
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Nieuwe lijst maken
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="text-sm text-neutral-400 mb-2">{filteredLists.length} lijsten beschikbaar</div>
                                {filteredLists.map(list => (
                                    <div
                                        key={list.list_id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700"
                                    >
                                        <div className="flex items-center gap-3">
                                            {list.subject && getSubjectIcon(list.subject) && (
                                                <Image
                                                    src={getSubjectIcon(list.subject)}
                                                    alt={list.subject}
                                                    width={24}
                                                    height={24}
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium">{list.name}</p>
                                                {getWordCount(list.data, list.mode) && (
                                                    <p className="text-sm text-neutral-400">
                                                        {getWordCount(list.data, list.mode)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* <Button
                                            onClick={() => handleAddList(list.list_id)}
                                            disabled={isSubmitting !== null}
                                            className="bg-sky-600 hover:bg-sky-700"
                                        >
                                            {isSubmitting === list.list_id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                "Toevoegen"
                                            )}
                                        </Button> */}
                                        <Button1
                                            onClick={() => handleAddList(list.list_id)}
                                            disabled={isSubmitting !== null}
                                            text="Toevoegen"
                                            icon={isSubmitting === list.list_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                                        />
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
