"use client"
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export default function ClientToastNotifier() {
	const searchParams = useSearchParams();
	const router = useRouter();

	useEffect(() => {
		if (searchParams.get("error")) {
			toast.error("Email of wachtwoord is onjuist. Controleer uw gegevens en probeer het opnieuw.");
			router.replace(window.location.pathname);
		}
	}, [searchParams, router]);

	return null;
}
