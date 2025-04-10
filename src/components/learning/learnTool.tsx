"use client";

import { useState, useCallback, useMemo, memo } from 'react';
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import check from '@/app/img/check.svg';
import wrong from '@/app/img/wrong.svg';
import Button1 from "@/components/button/Button1";

// Memoize the question display component
const QuestionDisplay = memo(({ question }: { question: string }) => (
  <div className="px-4 py-2 bg-neutral-700 rounded-lg mb-4 min-w-[240px] max-w-[400px] text-center">
    <span className="font-extrabold">{question}</span>
  </div>
));

// Memoize the answer overlay component
const AnswerOverlay = memo(({ correct, answer }: { correct: boolean; answer?: string }) => (
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
        Verkeerd! het antwoord was <span className="pl-1 font-extrabold">{answer}</span>
      </>
    )}
  </motion.div>
));

// Memoize the multi-choice button component
const MultiChoiceButton = memo(({
  onClick,
  isCorrect,
  optionNumber,
  text,
  disabled
}: {
  onClick: () => void,
  isCorrect: boolean,
  optionNumber: number,
  text: string,
  disabled: boolean
}) => {
  const isTruncated = text.length > 60;
  const displayText = isTruncated ? text.substring(0, 60) + "..." : text;
  const shouldShowTooltip = isTruncated && !disabled;

  return (
    <div className="relative p-1.5 transform-gpu">
      {shouldShowTooltip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button1
                  onClick={onClick}
                  disabled={disabled}
                  text={displayText}
                  className="w-full h-auto text-sm"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-neutral-900 border border-neutral-700 text-white max-w-xs text-xs">
              {text}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button1
          onClick={onClick}
          disabled={disabled}
          text={displayText}
          className="w-full h-auto text-sm"
        />
      )}
    </div>
  );
});

// Memoize the scrollable answer component
const ScrollableAnswer = memo(({ text }: { text: string }) => (
  <span className="font-extrabold">{text}</span>
));

const LearnTool = ({
  mode,
  rawlistdata
}: {
  mode: "toets" | "gedachten" | "hints" | "learn" | "multikeuze";
  rawlistdata: any[];
}) => {
  // Use useCallback for this function since it's used in initialization
  const shuffleArray = useCallback(<T,>(array: T[]): T[] =>
    [...array].sort(() => Math.random() - 0.5),
    []);

  // Use useMemo for initial data processing
  const initialMappedData = useMemo(() => {
    if (!rawlistdata) return [];

    return rawlistdata
      .map(item => ({
        vraag: item.vraag || item["1"] || "",
        antwoord: item.antwoord || item["2"] || ""
      }))
      .filter(item => item.vraag && item.antwoord);
  }, [rawlistdata]);

  const [lijstData, setLijstData] = useState(() => shuffleArray(initialMappedData));
  const [lijstDataOud, setLijstDataOud] = useState(() => shuffleArray(initialMappedData));
  const [userInput, setUserInput] = useState("");
  const [toonAntwoord, setToonAntwoord] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [randomNumber, setRandomNumber] = useState(Math.floor(Math.random() * 4) + 1);
  const [isAnswering, setIsAnswering] = useState(false);

  // Use useCallback for event handlers that are passed to child components
  const antwoordFoutVolgende = useCallback(() => {
    if (lijstData.length > 0) {
      const [huidigeVraag, ...rest] = lijstData;
      setLijstData([...rest, huidigeVraag]);
    }
    setToonAntwoord(false);
  }, [lijstData]);

  const handleAntwoordControleren = useCallback(() => {
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
  }, [lijstData, userInput, shuffleArray, antwoordFoutVolgende]);

  const handleAntwoordControlerenGedachten = useCallback((isAntwoordCorrect: boolean) => {
    if (!lijstData.length) return;
    const [huidigeVraag, ...rest] = lijstData;
    if (isAntwoordCorrect) {
      setShowCorrect(true);
      setTimeout(() => {
        setShowCorrect(false);
        setLijstData(shuffleArray(rest));
      }, 2000);
    } else {
      antwoordFoutVolgende();
    }
  }, [lijstData, shuffleArray, antwoordFoutVolgende]);

  const handleAntwoordmultikeuze = useCallback((isAntwoordCorrect: boolean) => {
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
  }, [lijstData, isAnswering, shuffleArray, antwoordFoutVolgende]);

  // Use useMemo for derived calculations
  const getOptionText = useCallback((buttonNumber: number, correctAnswer: string): string => {
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
    } while (randomAnswer.toLowerCase() === correctAnswer.toLowerCase() || randomAnswer === "");

    return randomAnswer;
  }, [randomNumber, lijstDataOud]);

  return (
    <div className='bg-neutral-800 relative min-w-[240px] w-full max-w-[600px] h-auto min-h-[240px] max-h-[350px] rounded-lg flex flex-col justify-center'>
      {/* Component content */}
    </div>
  );
};

export default memo(LearnTool);
