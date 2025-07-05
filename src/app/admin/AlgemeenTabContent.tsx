import { getAdminSettings } from "@/serverActions/adminSettings";
import AlgemeenTabClient from "./AlgemeenTabClient";

export default async function AlgemeenTabContent() {
    const settings = await getAdminSettings();

    return (
        <AlgemeenTabClient
            forumEnabled={settings.forumEnabled}
            registrationEnabled={settings.registrationEnabled}
        />
    );
}
