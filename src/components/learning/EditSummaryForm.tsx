"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSummaryById, saveSummary, SummaryData } from "@/serverActions/summaryActions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DropdownBtn, { DropdownHandle } from "@/components/button/DropdownBtn";
import { Vakken } from "@/components/icons";
import Image from "next/image";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

interface EditSummaryFormProps {
    summaryId: string;
}

const EditSummaryForm: React.FC<EditSummaryFormProps> = ({ summaryId }) => {
    const router = useRouter();
    const id = summaryId; // Use prop

    const [summaryName, setSummaryName] = useState("");
    const [summaryContent, setSummaryContent] = useState("");
    const [selectedSubject, setSelectedSubject] = useState<{ id: string; display: React.ReactNode } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [autosavedSummaryId, setAutosavedSummaryId] = useState<string | null>(id);

    const dropdownRef = useRef<DropdownHandle>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const subjectOptions = Vakken.map((vak) => ({
        id: vak.afkorting,
        display: (
            <div className="flex items-center">
                <Image src={vak.icon} alt={vak.naam} width={20} height={20} className="mr-2" />
                {vak.naam}
            </div>
        ),
    }));

    useEffect(() => {
        if (id) {
            const fetchSummary = async () => {
                setIsLoading(true);
                try {
                    const summary = await getSummaryById(id);
                    if (summary && !('error' in summary)) {
                        setSummaryName(summary.name || "Nieuwe samenvatting");
                        setSummaryContent(summary.summaryContent || "");
                        if (summary.subject) {
                            const subject = Vakken.find(v => v.afkorting === summary.subject);
                            if (subject) {
                                setSelectedSubject({
                                    id: subject.afkorting,
                                    display: (
                                        <div className="flex items-center">
                                            <Image src={subject.icon} alt={subject.naam} width={20} height={20} className="mr-2" />
                                            {subject.naam}
                                        </div>
                                    ),
                                });
                                if (dropdownRef.current) {
                                    dropdownRef.current.setValue(subject.afkorting, (
                                        <div className="flex items-center">
                                            <Image src={subject.icon} alt={subject.naam} width={20} height={20} className="mr-2" />
                                            {subject.naam}
                                        </div>
                                    ));
                                }
                            }
                        }
                        setLastSaved(summary.lastSaved ? new Date(summary.lastSaved) : null);
                    } else {
                        const errorMessage = summary && 'error' in summary ? summary.error : "Samenvatting niet gevonden of je hebt geen toegang.";
                        toast.error(errorMessage);
                        router.push("/learn");
                    }
                } catch (error) {
                    console.error("Error fetching summary:", error);
                    toast.error("Fout bij het ophalen van de samenvatting.");
                    router.push("/learn");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSummary();
        }
    }, [id, router]);

    const handleAutosave = useCallback(async (currentContent: string, currentName: string, currentSubjectId?: string) => {
        if (!autosavedSummaryId || !currentSubjectId) return;
        setIsSaving(true);
        try {
            const summaryData: SummaryData = {
                id: autosavedSummaryId,
                name: currentName,
                subjectId: currentSubjectId,
                content: currentContent,
            };
            const result = await saveSummary(summaryData);
            if (result && result.id) {
                setLastSaved(new Date());
                toast.success("Wijzigingen automatisch opgeslagen!");
            } else {
                toast.error("Fout bij automatisch opslaan.");
            }
        } catch (error) {
            console.error("Autosave error:", error);
            toast.error("Fout bij automatisch opslaan.");
        } finally {
            setIsSaving(false);
        }
    }, [autosavedSummaryId]);

    useEffect(() => {
        if (summaryContent === null || summaryName === null || selectedSubject === null) return;

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            if (selectedSubject?.id) {
                handleAutosave(summaryContent, summaryName, selectedSubject.id);
            }
        }, 2000);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [summaryContent, summaryName, selectedSubject, handleAutosave]);

    const handleManualSave = async () => {
        if (!autosavedSummaryId || !selectedSubject?.id) {
            toast.error("Selecteer een vak om op te slaan.");
            return;
        }
        setIsSaving(true);
        try {
            const summaryData: SummaryData = {
                id: autosavedSummaryId,
                name: summaryName,
                subjectId: selectedSubject.id,
                content: summaryContent,
            };
            const result = await saveSummary(summaryData);
            if (result && result.id) {
                setLastSaved(new Date());
                toast.success("Samenvatting succesvol opgeslagen!");
            } else {
                toast.error("Fout bij het opslaan van de samenvatting.");
            }
        } catch (error) {
            console.error("Manual save error:", error);
            toast.error("Fout bij het opslaan van de samenvatting.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="pt-10 text-center">Samenvatting gegevens laden...</div>;
    }

    return (
        <>
            <div className="px-4 py-2">
                <div className="flex justify-end items-center mb-4">
                    <Button
                        onClick={handleManualSave}
                        disabled={isSaving || !selectedSubject || !summaryName.trim()}
                    >
                        {isSaving ? "Opslaan..." : "Opslaan"}
                    </Button>
                </div>

                <div className="mb-4 text-sm">
                    {isSaving && <p className="text-blue-500">Bezig met opslaan...</p>}
                    {lastSaved && !isSaving && (
                        <p className="text-green-500">
                            Laatst opgeslagen: {formatRelativeTime(lastSaved)}
                        </p>
                    )}
                    {(!selectedSubject || !summaryName.trim()) && !isSaving && (
                        <p className="text-yellow-500">
                            {!summaryName.trim() && !selectedSubject ? "Geef een naam op en selecteer een vak om op te slaan." :
                                !summaryName.trim() ? "Geef een naam op om op te slaan." :
                                    "Selecteer een vak om op te slaan."
                            }
                        </p>
                    )}
                </div>

                <div className="mb-4">
                    <label htmlFor="summaryName" className="block text-sm font-medium text-gray-300 mb-1">
                        Naam samenvatting
                    </label>
                    <Input
                        id="summaryName"
                        value={summaryName}
                        onChange={(e) => setSummaryName(e.target.value)}
                        placeholder="Geef je samenvatting een naam"
                        className="bg-neutral-800"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Vak</label>
                    <DropdownBtn
                        ref={dropdownRef}
                        text={selectedSubject ? (typeof selectedSubject.display === 'string' ? selectedSubject.display : Vakken.find(v => v.afkorting === selectedSubject.id)?.naam || "Kies een vak") : "Kies een vak"}
                        dropdownMatrix={subjectOptions.map(opt => [opt.display, opt.id])}
                        selectorMode={true}
                        width={300} // Preserved user's fix for thin dropdown
                        onChangeSelected={(selected) => {
                            const subject = Vakken.find(v => v.afkorting === selected.id);
                            if (subject) {
                                setSelectedSubject({
                                    id: subject.afkorting,
                                    display: (
                                        <div className="flex items-center">
                                            <Image src={subject.icon} alt={subject.naam} width={20} height={20} className="mr-2" />
                                            {subject.naam}
                                        </div>
                                    ),
                                });
                            }
                        }}
                    />
                </div>

                <Textarea
                    value={summaryContent}
                    onChange={(e) => setSummaryContent(e.target.value)}
                    placeholder="Begin met het schrijven van je samenvatting..."
                    className="min-h-[calc(100vh-380px)] bg-neutral-800" // Adjusted min-height
                />
            </div>
            <ToastContainer position="bottom-right" autoClose={3000} />
        </>
    );
};

export default EditSummaryForm;
