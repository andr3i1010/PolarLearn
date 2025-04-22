"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { updateGroupSettings } from "@/serverActions/groupActions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
    groupId: string;
    initialName: string;
    initialDescription: string;
    initialEveryoneCanAddLists: boolean;
    isCreator: boolean;
}

export default function SettingsForm({
    groupId,
    initialName,
    initialDescription,
    initialEveryoneCanAddLists,
    isCreator
}: SettingsFormProps) {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [everyoneCanAddLists, setEveryoneCanAddLists] = useState(initialEveryoneCanAddLists);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await updateGroupSettings({
                groupId,
                name,
                description,
                everyoneCanAddLists
            });

            if (result.success) {
                toast.success("Groepsinstellingen bijgewerkt");
                router.refresh();
            } else {
                toast.error(result.error || "Er is een fout opgetreden bij het bijwerken van de instellingen");
            }
        } catch (error) {
            console.error("Error updating group settings:", error);
            toast.error("Er is een fout opgetreden bij het bijwerken van de instellingen");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label htmlFor="groupName">Groepsnaam</Label>
                <Input
                    id="groupName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Groepsnaam"
                    required
                    className="mt-1 bg-neutral-700 border-neutral-600"
                />
            </div>

            <div>
                <Label htmlFor="groupDescription">Beschrijving</Label>
                <Textarea
                    id="groupDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Beschrijving van de groep"
                    rows={3}
                    className="mt-1 bg-neutral-700 border-neutral-600"
                />
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <Label htmlFor="everyoneCanAddLists" className="text-base">
                        Alle leden kunnen lijsten toevoegen
                    </Label>
                    <p className="text-neutral-400 text-sm">
                        Als dit uitgeschakeld is, kunnen alleen beheerders lijsten toevoegen
                    </p>
                </div>
                <Switch
                    id="everyoneCanAddLists"
                    checked={everyoneCanAddLists}
                    onCheckedChange={setEveryoneCanAddLists}
                />
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 bg-sky-600 hover:bg-sky-700"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opslaan...
                    </>
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        Opslaan
                    </>
                )}
            </Button>
        </form>
    );
}
