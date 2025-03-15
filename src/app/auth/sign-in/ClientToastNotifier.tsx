"use client"
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export default function ClientToastNotifier() {
	const searchParams = useSearchParams();
	const router = useRouter();

	useEffect(() => {
		const errorParam = searchParams.get("error");
		if (errorParam) {
			let message = "";
			if (errorParam === "CredentialsSignin") {
				const codeParam = searchParams.get("code");
				console.log(codeParam)
				if (codeParam && codeParam.startsWith("AccessDenied")) {
					const banReason = codeParam.split("AccessDenied:")[1]?.trim() || "Geen reden beschikbaar.";
					message = `Je bent verbannen van PolarLearn, met de reden: ${banReason}`;
				} else if (codeParam === "User not found") {
					message = "Email of wachtwoord is onjuist. Controleer uw gegevens en probeer het opnieuw.";
				} else {
					message = codeParam || "Onbekende fout?";
				}
			} else {
				const errorMessages: Record<string, string> = {
					Configuration: "🚨 Interne serverfout!",
					Verification: "Deze error zou niet moeten bestaan.",
					Default: "Email of wachtwoord is onjuist. Controleer uw gegevens en probeer het opnieuw."
				};
				message = errorMessages[errorParam] || errorMessages.Default;
			}
			toast.error(message);
			// Clear all cookies
			document.cookie.split(";").forEach((c) => {
				const cookieName = c.split("=")[0].trim();
				document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
			});
			router.replace(window.location.pathname);
		}
	}, [searchParams, router]);

	return null;
}
