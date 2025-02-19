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
			const errorMessages: Record<string, string> = {
				Configuration: "🚨 Interne serverfout!",
				AccessDenied: "Je bent verbannen van PolarLearn. Check je E-mail voor meer informatie.",
				Verification: "Deze error zou niet moeten bestaan.",
				Default: "Email of wachtwoord is onjuist. Controleer uw gegevens en probeer het opnieuw."
			};
			const message = errorMessages[errorParam] || errorMessages.Default;
			toast.error(message);
			router.replace(window.location.pathname);
		}
	}, [searchParams, router]);

	return null;
}
