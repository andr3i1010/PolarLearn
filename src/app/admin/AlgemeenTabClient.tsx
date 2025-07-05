'use client'

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { updateAdminSettings } from "@/serverActions/adminSettings";
import { toast } from "react-toastify";
import { useState } from "react";

interface AlgemeenTabClientProps {
    forumEnabled: boolean;
    registrationEnabled: boolean;
}

export default function AlgemeenTabClient({ forumEnabled, registrationEnabled }: AlgemeenTabClientProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSwitchChange = async (settingName: string, value: boolean) => {
        if (isUpdating) return; // Prevent multiple concurrent updates

        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.set(settingName, value ? 'on' : 'off');

            // Also send the other setting to maintain its current state
            const otherSetting = settingName === 'forumEnabled' ? 'registrationEnabled' : 'forumEnabled';
            const otherValue = settingName === 'forumEnabled' ? registrationEnabled : forumEnabled;
            formData.set(otherSetting, otherValue ? 'on' : 'off');

            await updateAdminSettings(formData);
            toast.success('Instelling opgeslagen!');
        } catch (error) {
            console.error('Error saving setting:', error);
            toast.error('Fout bij het opslaan van instelling');
        } finally {
            setIsUpdating(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Settings className="h-6 w-6" />
                <h2 className="text-2xl font-bold">Platform Instellingen</h2>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label htmlFor="forum-enabled" className="text-base font-medium">
                            Forum
                        </Label>
                        <p className="text-sm text-gray-500">
                            Schakel het forum in of uit voor alle gebruikers
                        </p>
                    </div>
                    <Switch
                        id="forum-enabled"
                        checked={forumEnabled}
                        disabled={isUpdating}
                        onCheckedChange={(checked) => handleSwitchChange('forumEnabled', checked)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label htmlFor="registration-enabled" className="text-base font-medium">
                            Registratie
                        </Label>
                        <p className="text-sm text-gray-500">
                            Sta nieuwe gebruikers toe om accounts aan te maken
                        </p>
                    </div>
                    <Switch
                        id="registration-enabled"
                        checked={registrationEnabled}
                        disabled={isUpdating}
                        onCheckedChange={(checked) => handleSwitchChange('registrationEnabled', checked)}
                    />
                </div>
            </div>
        </div>
    );
}
