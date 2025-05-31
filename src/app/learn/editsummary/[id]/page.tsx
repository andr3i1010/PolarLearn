"use client";

import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, ReactNode, useEffect, useCallback } from "react";
import Dropdown, { DropdownHandle } from "@/components/button/DropdownBtn";
import { defaultItems } from "@/components/icons";
import { getSummaryById, saveSummary, publishSummary } from "@/serverActions/summaryActions"; // Import publishSummary
import { toast } from "react-toastify";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { Input } from "@/components/ui/input";
import Button1 from "@/components/button/Button1";
import { useParams, useRouter } from "next/navigation";

export default function Page() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [selectedSubject, setSelectedSubject] = useState<{ id: string; display: ReactNode } | undefined>(undefined);
    const subjectDropdownRef = useRef<DropdownHandle>(null);
    const [summaryName, setSummaryName] = useState("");
    const [summaryContent, setSummaryContent] = useState("");
    const [autosavedSummaryId, setAutosavedSummaryId] = useState<string | undefined>(id);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPublished, setIsPublished] = useState(false); // State for published status
    const [isPublishing, setIsPublishing] = useState(false); // State for publishing process
    const debouncedSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // State for last autosaved values
    const [lastAutosavedName, setLastAutosavedName] = useState<string>("");
    const [lastAutosavedContent, setLastAutosavedContent] = useState<string>("");
    const [lastAutosavedSubjectId, setLastAutosavedSubjectId] = useState<string | undefined>(undefined);

    const subjectEntries: [React.ReactNode, string][] = defaultItems.map(item => [item.label, item.value]);

    useEffect(() => {
        if (id) {
            const fetchSummaryData = async () => {
                setIsLoading(true);
                try {
                    const summary = await getSummaryById(id);
                    if (summary && !('error' in summary)) {
                        setSummaryName(summary.name || "");
                        setSummaryContent(summary.summaryContent || "");
                        setAutosavedSummaryId(summary.id || undefined);
                        setLastSaved(summary.lastSaved ? new Date(summary.lastSaved) : null);
                        setIsPublished(summary.published); // Set published state

                        // Initialize last autosaved states
                        setLastAutosavedName(summary.name || "");
                        setLastAutosavedContent(summary.summaryContent || "");
                        setLastAutosavedSubjectId(summary.subject || undefined);

                        if (summary.subject) {
                            const subjectData = defaultItems.find(item => item.value === summary.subject);
                            if (subjectData) {
                                setSelectedSubject({ id: subjectData.value, display: subjectData.label });
                            } else {
                                setSelectedSubject(undefined);
                                toast.warn("Het opgeslagen vak kon niet worden gevonden in de lijst.");
                            }
                        } else {
                            setSelectedSubject(undefined);
                        }
                    } else {
                        toast.error(summary?.error || "Samenvatting niet gevonden. Mogelijk is deze verwijderd of heb je geen toegang.");
                        router.push("/learn");
                    }
                } catch (error) {
                    toast.error("Fout bij het ophalen van de samenvatting.");
                    console.error("Fetch summary error:", error);
                    router.push("/learn");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSummaryData();
        } else {
            toast.error("Geen samenvatting ID gevonden in de URL.");
            setIsLoading(false);
            router.push("/learn");
        }
    }, [id, router]);

    const handleAutosave = useCallback(async (currentContent: string, currentName: string, currentSubjectId?: string) => {
        if (!currentSubjectId) {
            // Allow autosave if an ID already exists (e.g. content/name change on existing draft without subject yet)
            // but if no ID and no subject, don't attempt to create.
            if (!autosavedSummaryId) return;
        }
        if (isSaving) return;

        setIsSaving(true);
        try {
            const result = await saveSummary({
                id: autosavedSummaryId,
                name: currentName,
                subjectId: currentSubjectId || selectedSubject?.id || "", // Ensure subjectId is passed
                content: currentContent,
                autosave: true, // Add autosave flag
            });

            if (result.id) {
                setAutosavedSummaryId(result.id);
                if (result.lastSaved) {
                    setLastSaved(new Date(result.lastSaved));
                }
                // Update last autosaved states with the successfully saved values
                setLastAutosavedName(currentName);
                setLastAutosavedContent(currentContent);
                setLastAutosavedSubjectId(currentSubjectId || selectedSubject?.id || undefined); // Use the ID that was actually sent
            } else if (result.error) {
                // Optionally show a non-intrusive error to the user
            }
        } catch (error) {
            // console.error("Autosave exception:", error);
        } finally {
            setIsSaving(false);
        }
    }, [autosavedSummaryId, selectedSubject, isSaving]); // Removed lastAutosaved states from here as they are set inside

    useEffect(() => {
        if (debouncedSaveTimeoutRef.current) {
            clearTimeout(debouncedSaveTimeoutRef.current);
        }

        const currentSubjectId = selectedSubject?.id;
        const hasChanges = summaryName !== lastAutosavedName ||
            summaryContent !== lastAutosavedContent ||
            currentSubjectId !== lastAutosavedSubjectId;

        // Only autosave if a subject is selected (or if it's an existing summary being edited),
        // initial loading is done, and there are actual changes.
        if (!isLoading && hasChanges && (currentSubjectId || autosavedSummaryId)) {
            debouncedSaveTimeoutRef.current = setTimeout(() => {
                // Pass currentSubjectId explicitly to handleAutosave
                handleAutosave(summaryContent, summaryName, currentSubjectId);
            }, 1500); // Autosave after 1.5 seconds of inactivity
        }

        return () => {
            if (debouncedSaveTimeoutRef.current) {
                clearTimeout(debouncedSaveTimeoutRef.current);
            }
        };
    }, [summaryContent, summaryName, selectedSubject, isLoading, handleAutosave, lastAutosavedName, lastAutosavedContent, lastAutosavedSubjectId, autosavedSummaryId]);

    const handleManualSave = async () => {
        if (!selectedSubject?.id) {
            toast.error("Selecteer een vak voordat je opslaat.");
            return;
        }
        if (!summaryContent.trim() && !summaryName.trim()) { // Check if both are empty
            toast.error("Geef een naam en schrijf wat inhoud voor je samenvatting voordat je opslaat.");
            return;
        }
        if (!summaryName.trim()) {
            toast.error("Geef een naam aan je samenvatting voordat je opslaat.");
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
                name: summaryName,
                subjectId: selectedSubject.id,
                content: summaryContent,
                autosave: false, // Explicitly false for manual save
            });

            if (result.id) {
                setAutosavedSummaryId(result.id);
                if (result.lastSaved) {
                    setLastSaved(new Date(result.lastSaved));
                }
                toast.success(result.message || "Samenvatting opgeslagen!");
                router.push(`/learn/summary/${result.id}`); // Redirect to view summary page
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

    const handlePublish = async () => {
        if (!autosavedSummaryId) {
            toast.error("Kan samenvatting niet publiceren: ID ontbreekt.");
            return;
        }
        if (isPublishing) return;

        setIsPublishing(true);
        try {
            const result = await publishSummary({ id: autosavedSummaryId });
            if (result.id && !result.error) {
                setIsPublished(true);
                setLastSaved(result.lastSaved ? new Date(result.lastSaved) : lastSaved); // Update lastSaved if available
                toast.success(result.message || "Samenvatting succesvol gepubliceerd!");
            } else {
                toast.error(result.error || "Kon samenvatting niet publiceren.");
            }
        } catch (error) {
            toast.error("Er is een onbekende fout opgetreden bij het publiceren.");
            console.error("Publish error:", error);
        } finally {
            setIsPublishing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="px-2 pb-20 text-center pt-10">
                <h1 className="font-extrabold text-4xl">Samenvatting Laden...</h1>
                <p className="text-gray-400 mt-2">Een ogenblik geduld terwijl de gegevens worden opgehaald.</p>
            </div>
        );
    }

    return (
        <div className="px-2 pb-20">
            <div className="w-full text-center py-2">
                <h1 className="font-extrabold text-4xl">Samenvatting Bewerken</h1>
                <div className="text-xs mt-1 h-4">
                    {isSaving ? (
                        <span className="text-blue-400">Bezig met opslaan...</span>
                    ) : lastSaved ? (
                        <span className="text-green-400">Laatst opgeslagen: {formatRelativeTime(lastSaved)}</span>
                    ) : (
                        <span>&nbsp;</span>
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
            <div className="my-4 flex justify-center relative">
                <Dropdown
                    ref={subjectDropdownRef}
                    text={selectedSubject ? selectedSubject.display as string : "Selecteer een vak"}
                    width={300}
                    dropdownMatrix={subjectEntries}
                    selectorMode={true}
                    onChange={(selectedItem) => {
                        setSelectedSubject(selectedItem);
                        // Autosave is no longer triggered on subject change
                    }}
                />
            </div>

            <Textarea
                className="border-neutral-600 resize-none mt-16 h-[calc(100vh-280px)] text-xl"
                placeholder="Schrijf hier je samenvatting..."
                value={summaryContent}
                onChange={(e) => setSummaryContent(e.target.value)}
            />
            <div className="mt-2 flex justify-between items-center">
                <div>
                    <p className="text-gray-400 text-sm">
                        Schrijf je samenvatting in het tekstvak boven, Markdown wordt ondersteund.
                    </p>
                </div>
                <div className="flex space-x-2">
                    {!isPublished && (
                        <Button1
                            onClick={handlePublish}
                            disabled={isPublishing || isSaving || !autosavedSummaryId}
                            text={isPublishing ? "Publiceren..." : "Publiceren"}
                        />
                    )}
                    <Button1 onClick={handleManualSave} disabled={isSaving || !selectedSubject?.id || !summaryContent.trim() || !summaryName.trim()} text={"Opslaan"} />
                </div>
            </div>
        </div>
    )
}