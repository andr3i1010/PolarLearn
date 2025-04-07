"use client";

import { useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import Image from 'next/image';

import check from '@/app/img/check.svg';
import wrong from '@/app/img/wrong.svg';
import Button1 from "@/components/button/Button1";

export default function LearnTool({
  mode,
  rawlistdata
}: {
  mode: "toets" | "gedachten" | "hints" | "learn" | "multikeuze";
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
  const [lijstDataOud, setLijstDataOud] = useState(() => shuffleArray(initialMappedData));
  const [userInput, setUserInput] = useState("");
  const [toonAntwoord, setToonAntwoord] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [randomNumber, setRandomNumber] = useState(Math.floor(Math.random() * 4) + 1);
  const [isAnswering, setIsAnswering] = useState(false);

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

  const handleAntwoordmultikeuze = (isAntwoordCorrect: boolean) => {
    if (!lijstData.length || isAnswering) return;
    setIsAnswering(true);
    const [huidigeVraag, ...rest] = lijstData;
    if (isAntwoordCorrect) {
      setShowCorrect(true);
      setTimeout(() => {
        setShowCorrect(false);
        setLijstData(shuffleArray(rest));
        setRandomNumber(Math.floor(Math.random() * 4) + 1);
        setIsAnswering(false);
      }, 2000);
    } else {
      setToonAntwoord(true);
      setTimeout(() => {
        antwoordFoutVolgende();
        setRandomNumber(Math.floor(Math.random() * 4) + 1);
        setIsAnswering(false);
      }, 2000);
    }
  };

  const getOptionText = (buttonNumber: number, correctAnswer: string): string => {
    if (randomNumber === buttonNumber) {
      return correctAnswer;
    }

    if (lijstDataOud.length < 2) {
      return "Optie";
    }

    let attempts = 0;
    let randomAnswer = "";

    do {
      if (attempts > 10) {
        const randomIndex = Math.floor(Math.random() * lijstDataOud.length);
        return lijstDataOud[randomIndex]?.antwoord || "Optie";
      }

      attempts++;
      const randomIndex = Math.floor(Math.random() * lijstDataOud.length);
      randomAnswer = lijstDataOud[randomIndex]?.antwoord || "";
    } while (randomAnswer === correctAnswer && attempts < 10);

    return randomAnswer || "Optie";
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

  if (!["toets", "gedachten", "hints", "multikeuze"].includes(mode)) {
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
                  className="border rounded p-4 w-60 border-neutral-700"
                  placeholder='Antwoord komt hier'
                />
                <Button1
                  onClick={handleAntwoordControleren}
                  aria-label="Controleer antwoord"
                  text='Controleer antwoord'
                >
                </Button1>
              </>
            ) : mode === "hints" ? (
              <> <p>{lijstData[0].antwoord.length < 3 ? lijstData[0].antwoord : lijstData[0].antwoord.charAt(0) + '_'.repeat(lijstData[0].antwoord.length - 1) + lijstData[0].antwoord.charAt(lijstData[0].antwoord.length)}</p>
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="border rounded p-2 w-60 border-neutral-700"
                  placeholder='Antwoord komt hier'
                />
                <Button1
                  onClick={handleAntwoordControleren}

                  aria-label="Controleer antwoord"
                  text='Controleer antwoord'
                >
                </Button1>
              </>
            ) : mode === "multikeuze" ? (
              <>
                {lijstData.length && lijstDataOud.length ? (
                  <div className='flex flex-col gap-4'>
                    <div className='flex flex-row items-center gap-4'>
                      <Button1
                        onClick={() => handleAntwoordmultikeuze(randomNumber === 1)}
                        className="w-40"
                        disabled={isAnswering}
                        aria-label="Multiple choice option 1"
                        text={getOptionText(1, lijstData[0].antwoord)}
                      >
                      </Button1>
                      <Button1
                        className="w-40"
                        onClick={() => handleAntwoordmultikeuze(randomNumber === 2)}
                        disabled={isAnswering}
                        aria-label="Multiple choice option 2"
                        text={getOptionText(2, lijstData[0].antwoord)}
                      >
                      </Button1>
                    </div>
                    <div className='flex flex-row items-center gap-4'>
                      <Button1
                        className="w-40"
                        onClick={() => handleAntwoordmultikeuze(randomNumber === 3)}
                        disabled={isAnswering}
                        aria-label="Multiple choice option 3"
                        text={getOptionText(3, lijstData[0].antwoord)}
                      >
                      </Button1>
                      <Button1
                        className="w-40"
                        onClick={() => handleAntwoordmultikeuze(randomNumber === 4)}
                        disabled={isAnswering}
                        aria-label="Multiple choice option 4"
                        text={getOptionText(4, lijstData[0].antwoord)}
                      >
                      </Button1>
                    </div>
                  </div>
                ) : (
                  <p className="text-center p-4">Niet genoeg woorden om meerkeuze te starten.</p>
                )}
              </>
            ) : (
              <>
                <Button1
                  onClick={() => setToonAntwoord(true)}
                  aria-label="Controleer antwoord"
                  text='Controleer antwoord'
                >
                </Button1>
                <AnimatePresence>
                  {toonAntwoord && (
                    <motion.div
                      className="absolute z-50 bottom-0 left-0 right-0 flex flex-col items-center justify-center bg-green-700 text-white h-24 rounded-lg text-2xl"
                      initial={{ y: "100%" }}
                      animate={{ y: ["100%", "0%", "0%", "0%"] }}
                      exit={{ y: "100%", transition: { duration: 0.4 } }}
                      transition={{ duration: 1.8, times: [0, 0.17, 0.83, 1] }}
                    >
                      <div className="flex items-center flex-row">
                        <p>
                          het antwoord was <span className="pl-1 font-extrabold">{lijstData[0].antwoord}</span>, had je het goed?
                        </p>
                        <br />
                        <Button1
                          onClick={() => {
                            setToonAntwoord(false);
                            handleAntwoordControlerenGedachten(true);
                          }}
                          aria-label="Ja, antwoord is correct"
                          text='Ja'
                        >
                        </Button1>
                        <br />
                        <Button1
                          onClick={() => {
                            setToonAntwoord(false);
                            handleAntwoordControlerenGedachten(false);
                          }}
                          text='Nee'
                          aria-label="Nee, antwoord is fout"
                        >
                        </Button1>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </>
        ) : (
          <p>Gefeliciteerd! Alle vragen beantwoord.</p>
        )}
        {showCorrect && <AnswerOverlay correct={true} />}
        {toonAntwoord && (mode === "toets" || mode === "hints" || mode === "multikeuze") && <AnswerOverlay correct={false} />}
      </div>
    </div>
  );
}
