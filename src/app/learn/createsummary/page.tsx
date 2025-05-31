"use client";

import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, ReactNode, useEffect, useCallback } from "react";
import Dropdown, { DropdownHandle } from "@/components/button/DropdownBtn";
import { defaultItems } from "@/components/icons";
import { saveSummary, publishSummary } from "@/serverActions/summaryActions";
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
        // Don't autosave if there's no meaningful content
        if (!currentContent.trim() && !currentName.trim() && !currentSubjectId) {
            return;
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
        if (selectedSubject?.id || summaryName.trim() || summaryContent.trim()) { // Autosave when there's any content
            debouncedSaveTimeoutRef.current = setTimeout(() => {
                handleAutosave(summaryContent, summaryName, selectedSubject?.id); // Pass summaryName
            }, 1500); // Autosave after 1.5 seconds of inactivity
        }

        return () => {
            if (debouncedSaveTimeoutRef.current) {
                clearTimeout(debouncedSaveTimeoutRef.current);
            }
        };
    }, [summaryContent, summaryName, selectedSubject, handleAutosave]);

    const handlePublish = async () => {
        if (!selectedSubject?.id) {
            toast.error("Selecteer een vak voordat je publiceert.");
            return;
        }
        if (!summaryContent.trim()) {
            toast.error("Schrijf wat inhoud voor je samenvatting voordat je publiceert.");
            return;
        }
        if (!summaryName.trim()) {
            toast.error("Geef je samenvatting een naam voordat je publiceert.");
            return;
        }

        setIsSaving(true);
        try {
            // First save the summary as concept if not already saved
            const saveResult = await saveSummary({
                id: autosavedSummaryId,
                name: summaryName,
                subjectId: selectedSubject.id,
                content: summaryContent,
            });

            if (saveResult.id) {
                // Then publish it
                const publishResult = await publishSummary({
                    id: saveResult.id,
                });

                if (publishResult.id) {
                    toast.success(publishResult.message || "Samenvatting gepubliceerd!");
                    router.push(`/learn/summary/${publishResult.id}`);
                } else if (publishResult.error) {
                    toast.error(publishResult.error);
                }
            } else if (saveResult.error) {
                toast.error(saveResult.error);
            }
        } catch (error) {
            toast.error("Kon samenvatting niet publiceren.");
            console.error("Publish error:", error);
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
                        // Trigger an autosave immediately when subject changes if any content exists
                        if (summaryContent.trim() || summaryName.trim()) {
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
                        Schrijf je samenvatting in het tekstvak boven, Markdown wordt ondersteund. Je werk wordt automatisch opgeslagen als concept.
                    </p>
                    {/* Old status line removed from here */}
                </div>
                <div className="flex gap-2">
                    <Button1
                        onClick={handlePublish}
                        disabled={isSaving || !selectedSubject?.id || !summaryContent.trim() || !summaryName.trim()}
                        text={"Publiceren"}
                    />
                </div>
            </div>
        </div>
    )
}