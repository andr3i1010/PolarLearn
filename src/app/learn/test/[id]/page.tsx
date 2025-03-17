"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export default function Page() {
    const { id } = useParams();
    const [lijstData, setLijstData] = useState<{ vraag: string; antwoord: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInput, setUserInput] = useState("");
    const [toonAntwoord, setToonAntwoord] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Fetching data for ID:", id);
                const response = await fetch(`/api/list_data/?id=${id}`);
                const result = await response.json();
                const dataArray = result?.data?.map((item: any) => ({
                    vraag: item["1"] || "",
                    antwoord: item["2"] || ""
                })) || [];

                setLijstData(shuffleArray(dataArray));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
        return array.sort(() => Math.random() - 0.5);
    }, []);

    const handleAntwoordControleren = () => {
        if (!lijstData.length || userInput.trim() === "") return;

        const [huidigeVraag, ...rest] = lijstData;

        if (userInput.trim().toLowerCase() === huidigeVraag.antwoord.toLowerCase()) {
            setLijstData(shuffleArray(rest));
            setUserInput("");

        } else {
            setToonAntwoord(true);
        }
    };
    const antwoordFoutVolgende = () => {
        setLijstData(shuffleArray(shuffleArray(lijstData)));
        setUserInput("");
        setToonAntwoord(false);
    };

    if (loading) return <p>Loading...</p>;

    return (
        <>
            {lijstData.length > 0 ? (
                <>
                    {!toonAntwoord ? (
                        <div id="invullen">
                            <p>{lijstData[0].vraag}</p>
                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                className="border rounded p-2 w-full"
                            />
                            <button
                                onClick={handleAntwoordControleren}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mt-2"
                            >
                                Controleer antwoord
                            </button>
                        </div>
                    ) : (
                        <div id="antwoord_tonen">
                            <p>Het juiste antwoord was: <strong>{lijstData[0].antwoord}</strong></p>
                            <button
                                onClick={antwoordFoutVolgende}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mt-2"
                            >
                                Volgende vraag
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <p>Gefeliciteerd! Alle vragen beantwoord.</p>
            )}
        </>
    );
}
