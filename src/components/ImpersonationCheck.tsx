"use client";

import { useState, useEffect } from "react";
import { checkImpersonationStatus } from "@/serverActions/checkImpersonation";
import ImpersonationBanner from "./ImpersonationBanner";

export default function ImpersonationCheck() {
    const [impersonationData, setImpersonationData] = useState<{
        admin: { name: string | null };
        impersonatedUser: { name: string | null };
    } | null>(null);
    const [isActive, setIsActive] = useState(false); useEffect(() => {
        // Check for impersonation state on mount
        const checkStatus = async () => {
            try {
                const data = await checkImpersonationStatus();
                setImpersonationData(data);
                setIsActive(!!data);

                // When impersonation is active, add padding to body to prevent content from being hidden
                if (data) {
                    document.body.classList.add('has-impersonation-banner');
                } else {
                    document.body.classList.remove('has-impersonation-banner');
                }
            } catch (error) {
                console.error("Error checking impersonation status:", error);
                // Remove class in case of error
                document.body.classList.remove('has-impersonation-banner');
            }
        };

        // Ensure the class is removed by default (prevents flashing)
        document.body.classList.remove('has-impersonation-banner');

        checkStatus();

        // Clean up when component unmounts
        return () => {
            document.body.classList.remove('has-impersonation-banner');
        };
    }, []);

    // Only render the banner if we have impersonation data
    if (!impersonationData) {
        // Make absolutely sure we remove the class when not impersonating
        if (typeof document !== 'undefined') {
            document.body.classList.remove('has-impersonation-banner');
        }
        return null;
    }

    // If we have impersonation data, show the banner
    return (
        <ImpersonationBanner
            adminName={impersonationData.admin.name || "Admin"}
            impersonatedUserName={impersonationData.impersonatedUser.name || "Gebruiker"}
        />
    );
}
