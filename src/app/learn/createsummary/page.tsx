"use client";

import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, ReactNode, useEffect, useCallback } from "react";
import Dropdown, { DropdownHandle } from "@/components/button/DropdownBtn";
import { defaultItems } from "@/components/icons";
import { saveSummary } from "@/serverActions/summaryActions";
import { toast } from "react-toastify";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { Input } from "@/components/ui/input"; // Added Input import
import Button1 from "@/components/button/Button1";
import { useRouter } from "next/navigation";

export default function Page() {
    const [selectedSubject, setSelectedSubject] = useState<{ id: string; display: ReactNode } | undefined>(undefined);
    const subjectDropdownRef = useRef<DropdownHandle>(null);
    const [summaryName, setSummaryName] = useState(""); // Added summaryName state
    const [summaryContent, setSummaryContent] = useState("");
    const [autosavedSummaryId, setAutosavedSummaryId] = useState<string | undefined>(undefined);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const debouncedSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const router = useRouter()

    const subjectEntries: [React.ReactNode, string][] = defaultItems.map(item => [item.label, item.value]);

    const handleAutosave = useCallback(async (currentContent: string, currentName: string, currentSubjectId?: string) => { // Added currentName
        if (!currentSubjectId) {
            // Don\'t autosave if no subject is selected yet, unless there\'s already an autosaved ID
            if (!autosavedSummaryId) return;
        }
        if (isSaving) return; // Prevent multiple saves at once

        setIsSaving(true);
        try {
            const result = await saveSummary({
                id: autosavedSummaryId,
                name: currentName, // Added name
                subjectId: currentSubjectId || selectedSubject?.id || "", // Ensure subjectId is always a string
                content: currentContent,
            });

            if (result.id) {
                setAutosavedSummaryId(result.id);
                if (result.lastSaved) {
                    setLastSaved(new Date(result.lastSaved));
                }
                // console.log("Autosaved:", result.message);
            } else if (result.error) {
                // console.error("Autosave error:", result.error);
                // Optionally show a non-intrusive error to the user
            }
        } catch (error) {
            // console.error("Autosave exception:", error);
        } finally {
            setIsSaving(false);
        }
    }, [autosavedSummaryId, selectedSubject, isSaving]);

    useEffect(() => {
        if (debouncedSaveTimeoutRef.current) {
            clearTimeout(debouncedSaveTimeoutRef.current);
        }
        if (selectedSubject?.id) { // Only start autosaving if a subject is selected
            debouncedSaveTimeoutRef.current = setTimeout(() => {
                handleAutosave(summaryContent, summaryName, selectedSubject?.id); // Pass summaryName
            }, 1500); // Autosave after 1.5 seconds of inactivity
        }

        return () => {
            if (debouncedSaveTimeoutRef.current) {
                clearTimeout(debouncedSaveTimeoutRef.current);
            }
        };
    }, [summaryContent, selectedSubject, handleAutosave]);

    const handleManualSave = async () => {
        if (!selectedSubject?.id) {
            toast.error("Selecteer een vak voordat je opslaat.");
            return;
        }
        if (!summaryContent.trim()) {
            toast.error("Schrijf wat inhoud voor je samenvatting voordat je opslaat.");
            return;
        }
        setIsSaving(true);
        try {
            const result = await saveSummary({
                id: autosavedSummaryId,
                name: summaryName, // Added name
                subjectId: selectedSubject.id,
                content: summaryContent,
            });

            if (result.id) {
                setAutosavedSummaryId(result.id);
                if (result.lastSaved) {
                    setLastSaved(new Date(result.lastSaved));
                }
                toast.success(result.message || "Samenvatting opgeslagen!");
                router.push(`/learn/summary/${result.id}`)
            } else if (result.error) {
                toast.error(result.error);
            } else {
                toast.error("Er is een onbekende fout opgetreden bij het opslaan.");
            }
        } catch (error) {
            toast.error("Kon samenvatting niet opslaan.");
            console.error("Manual save error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="px-2 pb-20"> {/* Added pb-20 for spacing */}
            <div className="w-full text-center py-2">
                <h1 className="font-extrabold text-4xl">Nieuwe samenvatting</h1>
                {/* Autosave status text moved here */}
                <div className="text-xs mt-1 h-4">
                    {isSaving ? (
                        <span className="text-blue-400">Bezig met opslaan...</span>
                    ) : lastSaved ? (
                        <span className="text-green-400">Laatst opgeslagen: {formatRelativeTime(lastSaved)}</span>
                    ) : (
                        <span>&nbsp;</span> /* Keep space if nothing to show */
                    )}
                </div>
            </div>

            {/* Summary Name Input */}
            <div className="my-4 flex justify-center">
                <Input
                    type="text"
                    placeholder="Naam van je samenvatting"
                    value={summaryName}
                    onChange={(e) => setSummaryName(e.target.value)}
                    className="w-full max-w-md bg-neutral-800"
                />
            </div>

            {/* Subject Dropdown */}
            <div className="my-4 flex justify-center relative"> {/* Centered dropdown */}
                <Dropdown
                    ref={subjectDropdownRef}
                    text={selectedSubject ? selectedSubject.display as string : "Selecteer een vak"}
                    width={300}
                    dropdownMatrix={subjectEntries}
                    selectorMode={true}
                    onChange={(selectedItem) => {
                        setSelectedSubject(selectedItem);
                        // Trigger an autosave immediately when subject changes if content exists
                        if (summaryContent.trim()) {
                            handleAutosave(summaryContent, summaryName, selectedItem.id); // Pass summaryName
                        }
                    }}
                />
            </div>

            <Textarea
                className="border-neutral-600 resize-none mt-16 h-[calc(100vh-280px)] text-xl" // Adjusted mt and height
                placeholder="Schrijf hier je samenvatting..."
                value={summaryContent}
                onChange={(e) => setSummaryContent(e.target.value)}
            />
            <div className="mt-2 flex justify-between items-center">
                <div> {/* Container for left-side texts */}
                    <p className="text-gray-400 text-sm">
                        Schrijf je samenvatting in het tekstvak boven, Markdown wordt ondersteund.
                    </p>
                    {/* Old status line removed from here */}
                </div>
                <Button1 onClick={handleManualSave} disabled={isSaving || !selectedSubject?.id || !summaryContent.trim()} text={"Opslaan"} />
            </div>
        </div>
    )
}