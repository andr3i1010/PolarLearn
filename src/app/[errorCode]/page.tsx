"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';

const errorDescriptions: { [key: string]: string } = {
    '200': 'Hoe heb je dit überhaupt gedaan!!??',
    '400': 'Onjuist verzoek',
    '401': 'Ongeautoriseerd',
    '403': 'Verboden',
    '404': 'Pagina niet gevonden',
    '500': 'Interne serverfout',
    '502': 'Slechte gateway',
    '503': 'Dienst niet beschikbaar',
    '504': 'Gatewaytime-out',
};

export default function ErrorPage() {
    const searchParams = useSearchParams();
    const errorCode = searchParams.get('errorCode');
    const errorDescription = errorCode ? errorDescriptions[errorCode] : 'Unknown error';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900   ">
            <h1 className="text-4xl font-bold text-red-600">Oeps!</h1>
            <p className="mt-4 text-xl text-white">
                Foutcode {errorCode ? errorCode : 'Onbekende fout'}: {errorDescription ? errorDescription : "Beschrijving voor foutcode niet beschikbaar"}
            </p>
        </div>
    );
}