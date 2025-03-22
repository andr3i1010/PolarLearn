"use client";

import { useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import Image from 'next/image';

import check from '@/app/img/check.svg';
import wrong from '@/app/img/wrong.svg';

export default function LearnTool({
  mode,
  rawlistdata
}: {
  mode: "toets" | "gedachten" | "hints" | "learn";
  rawlistdata: any[];
}) {
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => array.sort(() => Math.random() - 0.5), []);

  const initialMappedData = rawlistdata
    ? rawlistdata
      .map(item => ({
        vraag: item.vraag || item["1"] || "",
        antwoord: item.antwoord || item["2"] || ""
      }))
      .filter(item => item.vraag && item.antwoord)
    : [];

  const [lijstData, setLijstData] = useState(() => shuffleArray(initialMappedData));
  const [userInput, setUserInput] = useState("");
  const [toonAntwoord, setToonAntwoord] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);

  const antwoordFoutVolgende = () => {
    if (lijstData.length > 0) {
      const [huidigeVraag, ...rest] = lijstData;
      setLijstData([...rest, huidigeVraag]);
    }
    setToonAntwoord(false);
  };

  const handleAntwoordControleren = () => {
    if (!lijstData.length || userInput.trim() === "") return;
    const [huidigeVraag, ...rest] = lijstData;
    if (userInput.trim().toLowerCase() === huidigeVraag.antwoord.toLowerCase()) {
      setShowCorrect(true);
      setTimeout(() => {
        setShowCorrect(false);
        setLijstData(shuffleArray(rest));
        setUserInput("");
      }, 2000);
    } else {
      setToonAntwoord(true);
      setTimeout(() => {
        antwoordFoutVolgende();
      }, 2000);
    }
  };

  const handleAntwoordControlerenGedachten = (isAntwoordCorrect: boolean) => {
    if (!lijstData.length) return;
    const [huidigeVraag, ...rest] = lijstData;
    if (isAntwoordCorrect) {
      setLijstData(shuffleArray(rest));
    } else {
      antwoordFoutVolgende();
    }
  };

  const QuestionDisplay = () => (
    <div className="relative flex flex-col items-center w-full">
      <p className='text-2xl font-extrabold text-center'>{lijstData[0].vraag}</p>
      <div className="w-[95%] border-t border-neutral-700 my-4"></div>
    </div>
  );

  const AnswerOverlay = ({ correct }: { correct: boolean }) => (
    <motion.div
      className={`absolute z-50 bottom-0 left-0 right-0 flex items-center justify-center ${correct ? "bg-green-700" : "bg-red-700"
        } text-white h-20 rounded-lg text-2xl font-extrabold`}
      initial={{ y: "100%" }}
      animate={{ y: ["100%", "0%", "0%", "100%"] }}
      transition={{ duration: 1.8, times: [0, 0.17, 0.83, 1] }}
    >
      {correct ? (
        <>
          <Image src={check} width={40} height={40} alt="check icon" className="mr-4" />
          Correct!
        </>
      ) : (
        <>
          <Image src={wrong} width={40} height={40} alt="wrong icon" className="mr-4" />
          Verkeerd! het antwoord was <span className="pl-1 font-extrabold">{lijstData[0].antwoord}</span>
        </>
      )}
    </motion.div>
  );

  if (!["toets", "gedachten"].includes(mode)) {
    return <p>Ongeldige modus geselecteerd.</p>;
  }

  return (
    <div className='bg-neutral-800 relative min-w-[500px] h-60 rounded-lg flex flex-col justify-center'>
      <div id="invullen" className="w-full h-full flex flex-col items-center justify-center relative z-10 overflow-hidden">
        {lijstData.length > 0 ? (
          <>
            <QuestionDisplay />
            {mode === "toets" ? (
              <>
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="border rounded p-2 w-60 border-neutral-700"
                  placeholder='Antwoord komt hier'
                />
                <button
                  onClick={handleAntwoordControleren}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mt-6"
                  aria-label="Controleer antwoord"
                >
                  Controleer antwoord
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setToonAntwoord(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mt-6"
                  aria-label="Controleer antwoord"
                >
                  Controleer antwoord
                </button>
                {toonAntwoord && (
                  <motion.div
                    className="absolute z-50 bottom-0 left-0 right-0 flex flex-col items-center justify-center bg-green-700 text-white h-24 rounded-lg text-2xl"
                    initial={{ y: "100%" }}
                    animate={{ y: ["100%", "0%", "0%", "100%"] }}
                    transition={{ duration: 1.8, times: [0, 0.17, 0.83, 1] }}
                    onAnimationComplete={() => setToonAntwoord(false)} // Reset toonAntwoord after animation
                  >
                    <div className="flex items-center flex-row">
                      <p>
                        het antwoord was <span className="pl-1 font-extrabold">{lijstData[0].antwoord}</span>, had je het goed?

                      </p>
                      <br />
                      <button
                        onClick={() => {
                          handleAntwoordControlerenGedachten(true);
                          setToonAntwoord(false); // Reset toonAntwoord
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mt-6"
                        aria-label="Ja, antwoord is correct"
                      >
                        Ja!
                      </button>
                      <br />

                      <button
                        onClick={() => {
                          handleAntwoordControlerenGedachten(false);
                          setToonAntwoord(false); // Reset toonAntwoord
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mt-6"
                        aria-label="Nee, antwoord is fout"
                      >
                        Nee
                      </button>

                    </div>
                  </motion.div>
                )}
              </>
            )}
          </>
        ) : (
          <p>Gefeliciteerd! Alle vragen beantwoord.</p>
        )}
        {showCorrect && <AnswerOverlay correct={true} />}
        {toonAntwoord && mode === "toets" && <AnswerOverlay correct={false} />}
      </div>
    </div>
  );
}
