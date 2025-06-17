"use client"
import Button1 from "@/components/button/Button1";
import Dropdown from "@/components/button/DropdownBtn";
import { BookOpen, MousePointerClick } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Import learning method images
import learn from '@/app/img/learn.svg';
import test from '@/app/img/test.svg';
import hints from '@/app/img/hint.svg';
import mind from '@/app/img/mind.svg';
import livequiz from '@/app/img/livequiz.svg';

export default function ListTableComponent({
    wordPairs,
    fromLanguage,
    toLanguage,
    fromLanguageIcon,
    toLanguageIcon,
    isLanguageSubject,
    listId,
}: {
    wordPairs: { "1": string; "2": string; id: number }[];
    edit: boolean;
    fromLanguage?: string;
    toLanguage?: string;
    fromLanguageIcon?: any;
    toLanguageIcon?: any;
    isLanguageSubject?: boolean;
    listId: string;
}) {
    const [select, setSelect] = useState<boolean>(false);
    const [selectedPairs, setSelectedPairs] = useState<number[]>([]);

    const router = useRouter();

    const handleCheckboxChange = (pairId: number, isChecked: boolean) => {
        if (isChecked) {
            setSelectedPairs(prev => [...prev, pairId]);
        } else {
            setSelectedPairs(prev => prev.filter(id => id !== pairId));
        }
    };

    const toggleSelect = () => {
        setSelect(!select);
        // Clear selections when turning off select mode
        if (select) {
            setSelectedPairs([]);
        }
    };

    const handleLearn = (mode: string = 'test') => {
        document.cookie = `selectedPairs=${JSON.stringify(selectedPairs)}; path=/;`;
        document.cookie = `fromLanguage=${fromLanguage || ''}; path=/;`;
        document.cookie = `toLanguage=${toLanguage || ''}; path=/;`;
        document.cookie = `listId=${listId}; path=/;`;
        router.push(`/learn/custom/${mode}`);
    }

    return (
        <>
            <div className="px-3 pt-1 pb-4 flex flex-row gap-4">
                <Button1
                    text={select ? "Selectie uitzetten" : "Selecteren"}
                    icon={<MousePointerClick />}
                    onClick={toggleSelect}
                />
                {select ? (
                    <div className="flex flex-wrap gap-2">
                        <Button1
                            text="Leren"
                            icon={<Image src={learn} alt="gemengd leren" width={16} height={16} />}
                            disabled={!select || selectedPairs.length === 0}
                            onClick={() => handleLearn('leren')}
                            wrapText={false}
                        />
                        <Button1
                            text="Toets"
                            icon={<Image src={test} alt="toets" width={16} height={16} />}
                            disabled={!select || selectedPairs.length === 0}
                            onClick={() => handleLearn('test')}
                            wrapText={false}
                        />
                        <Button1
                            text="Hints"
                            icon={<Image src={hints} alt="hints" width={16} height={16} />}
                            disabled={!select || selectedPairs.length === 0}
                            onClick={() => handleLearn('hints')}
                            wrapText={false}
                        />
                        <Button1
                            text="Gedachten"
                            icon={<Image src={mind} alt="mind" width={16} height={16} />}
                            disabled={!select || selectedPairs.length === 0}
                            onClick={() => handleLearn('mind')}
                            wrapText={false}
                        />
                        <Button1
                            text="Multikeuze"
                            icon={<Image src={livequiz} alt="multikeuze" width={16} height={16} />}
                            disabled={!select || selectedPairs.length === 0}
                            onClick={() => handleLearn('multichoice')}
                            wrapText={false}
                        />
                    </div>
                ) : null}
            </div>
            <table className="min-w-full divide-y divide-gray-700 rounded-lg overflow-hidden">
                {/* Language header as part of the table */}
                {fromLanguage && toLanguage && (
                    <thead className="bg-neutral-800 border-b border-gray-700">
                        <tr>
                            {select && (
                                <th className="px-6 py-3 w-12">
                                    {/* Empty header for radio button column */}
                                </th>
                            )}
                            <th className={`px-6 py-3 ${select ? 'w-1/2' : 'w-1/2'}`}>
                                <div className="flex items-center justify-center">
                                    {fromLanguageIcon && (
                                        <Image
                                            src={fromLanguageIcon}
                                            alt={`${fromLanguage} icoon`}
                                            width={24}
                                            height={24}
                                            className="mr-2"
                                        />
                                    )}
                                    <span className="text-white text-xl font-bold">
                                        {fromLanguage}
                                    </span>
                                </div>
                            </th>
                            <th className={`px-6 py-3 ${select ? 'w-1/2' : 'w-1/2'}`}>
                                <div className="flex items-center justify-center">
                                    {toLanguageIcon && (
                                        <Image
                                            src={toLanguageIcon}
                                            alt={`${toLanguage} icon`}
                                            width={24}
                                            height={24}
                                            className="mr-2"
                                        />
                                    )}
                                    <span className="text-white text-xl font-bold">
                                        {toLanguage}
                                    </span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                )}
                <thead className="bg-gray-800">
                    <tr>
                        {select && (
                            <th
                                scope="col"
                                className="px-6 py-3 text-center text-xl font-medium text-gray-300 w-12"
                            >
                                Selectie
                            </th>
                        )}
                        <th
                            scope="col"
                            className={`px-6 py-3 text-center text-xl font-medium text-gray-300 ${select ? 'w-1/2' : 'w-1/2'}`}
                        >
                            {isLanguageSubject ? "Origineel" : "Term"}
                        </th>
                        <th
                            scope="col"
                            className={`px-6 py-3 text-center text-xl font-medium text-gray-300 ${select ? 'w-1/2' : 'w-1/2'}`}
                        >
                            {isLanguageSubject ? "Vertaling" : "Definitie"}
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-800">
                    {wordPairs
                        .filter(
                            (pair) => pair["1"] !== "" || pair["2"] !== "" // Only filter out completely empty pairs
                        )
                        .map((pair) => {
                            return (
                                <tr
                                    key={pair.id}
                                    className={
                                        pair.id % 2 === 0 ? "bg-neutral-800" : "bg-neutral-800"
                                    }
                                >
                                    {select && (
                                        <td className="px-6 py-4 text-center">
                                            <div className="relative inline-block">
                                                <input
                                                    type="checkbox"
                                                    id={`checkbox-${pair.id}`}
                                                    name="selectedPairs"
                                                    value={pair.id}
                                                    checked={selectedPairs.includes(pair.id)}
                                                    onChange={(e) => handleCheckboxChange(pair.id, e.target.checked)}
                                                    className="peer sr-only"
                                                />
                                                <label
                                                    htmlFor={`checkbox-${pair.id}`}
                                                    className="block w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded-full cursor-pointer relative transition-all duration-200 hover:border-sky-400 peer-checked:bg-sky-400 peer-checked:border-sky-400"
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <svg
                                                            className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={3}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    </div>
                                                </label>
                                                <style jsx>{`
                                                    input:checked + label svg {
                                                        opacity: 1;
                                                    }
                                                `}</style>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-center font-bold text-xl text-white">
                                        {pair["1"]}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-xl text-white">
                                        {pair["2"]}
                                    </td>
                                </tr>
                            );
                        })}
                </tbody>
            </table>
        </>
    );
}
