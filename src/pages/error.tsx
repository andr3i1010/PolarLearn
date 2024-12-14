// src/app/error.tsx
import { GetServerSideProps } from 'next';
import Button1 from "@/components/button/Button1";

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

interface ErrorPageProps {
    errorCode: string;
    errorDescription: string;
}

export const metadata = {
    title: "Error - PolarLearn",
    description: "Nog steeds beter dan StudyGo",
};

// This will be called on the server-side
export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const errorCode = query.errorCode as string || 'Unknown';
    const errorDescription = errorDescriptions[errorCode] || 'Beschrijving voor foutcode niet beschikbaar';

    // Perform server-side redirection if necessary
    if (errorCode === '404') {
        // Example: Redirect to home if 404 error occurs
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        };
    }

    // If there's no redirection, pass the error details to the page
    return {
        props: {
            errorCode,
            errorDescription,
        },
    };
};

export default function ErrorPage({ errorCode, errorDescription }: ErrorPageProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900">
            <h1 className="text-4xl font-bold text-red-600">Oeps!</h1>
            <p className="mt-4 text-xl text-white">
                Foutcode {errorCode}: {errorDescription}
            </p>
            <Button1 redirectTo={'/'} text={'Terug naar home'} className='px-8'/>
        </div>
    );
}
