"use client"

import { useState, useCallback, useEffect, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { PlusIcon, SearchIcon, Loader2, XCircleIcon, AlertCircleIcon } from "lucide-react";
import { getAvailableLists, addListToGroup } from "@/serverActions/groupActions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button1 from "../button/Button1";

// Subject images
import nsk_img from '@/app/img/nask.svg'
import math_img from '@/app/img/math.svg'
import eng_img from '@/app/img/english.svg'
import fr_img from '@/app/img/baguette.svg'
import de_img from '@/app/img/pretzel.svg'
import nl_img from '@/app/img/nl.svg'
import gs_img from '@/app/img/history.svg'
import bi_img from '@/app/img/bio.svg'
import ak_img from '@/app/img/geography.svg'

// Map subject codes to images
const subjectImages: { [key: string]: any } = {
    "NL": nl_img,
    "DE": de_img,
    "FR": fr_img,
    "EN": eng_img,
    "WI": math_img,
    "NSK": nsk_img,
    "AK": ak_img,
    "GS": gs_img,
    "BI": bi_img
};

interface List {
    list_id: string;
    name: string;
    subject: string;
    data: any;
    creator: string;
    published: boolean;
}

interface AddListDialogProps {
    groupId: string;
    children: ReactNode;
}

export default function AddListDialog({ groupId, children }: AddListDialogProps) {
    const [open, setOpen] = useState(false);
    const [availableLists, setAvailableLists] = useState<List[]>([]);
    const [filteredLists, setFilteredLists] = useState<List[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Fetch user's lists that aren't already in the group using server action
    const fetchAvailableLists = useCallback(async () => {
        if (!open) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await getAvailableLists(groupId);

            if (result.error) {
                console.error("Error from server:", result.error);
                setError(result.error);
                toast.error(`Fout bij ophalen van lijsten: ${result.error}`);
                return;
            }

            setAvailableLists(result.lists || []);
            setFilteredLists(result.lists || []);

            if (result.lists?.length === 0) {
                setError("Geen lijsten beschikbaar om toe te voegen aan deze groep.");
            }
        } catch (error) {
            console.error("Unexpected error fetching available lists:", error);
            setError(`Onverwachte fout: ${error}`);
            toast.error("Er is een fout opgetreden bij het ophalen van je lijsten.");
        } finally {
            setIsLoading(false);
        }
    }, [groupId, open]);

    // Load lists when dialog opens
    useEffect(() => {
        if (open) {
            fetchAvailableLists();
        }
    }, [open, fetchAvailableLists]);

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
            await addListToGroup(groupId, listId);
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
    const getWordCount = (data: any) => {
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
                                            {list.subject && subjectImages[list.subject] && (
                                                <Image
                                                    src={subjectImages[list.subject]}
                                                    alt={list.subject}
                                                    width={24}
                                                    height={24}
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium">{list.name}</p>
                                                <p className="text-sm text-neutral-400">
                                                    {getWordCount(list.data)}
                                                </p>
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
                                            icon={isSubmitting === list.list_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" /> }
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
