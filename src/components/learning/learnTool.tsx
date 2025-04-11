"use client";

import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import check from '@/app/img/check.svg';
import wrong from '@/app/img/wrong.svg';
import Button1 from "@/components/button/Button1";
import { useRouter } from 'next/router';

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
    animate={{ y: "0%" }}
    exit={{ y: "100%" }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {correct ? (
      <>
        <Image src={check} width={40} height={40} alt="check icon" className="mr-4" />
        Correct!
      </>
    ) : (
      <div className="flex items-center px-4 max-w-full">
        <Image src={wrong} width={40} height={40} alt="wrong icon" className="mr-4 flex-shrink-0" />
        <div className="overflow-hidden">
          <span>Verkeerd! het antwoord was </span>
          <span className="pl-1 font-extrabold truncate block max-w-[calc(100vw-180px)]">{answer}</span>
        </div>
      </div>
    )}
  </motion.div>
));

// Add a new GedachtenOverlay component
const GedachtenOverlay = memo(({ answer, onCorrect, onIncorrect }: {
  answer: string;
  onCorrect: () => void;
  onIncorrect: () => void;
}) => (
  <motion.div
    className="absolute z-50 bottom-0 left-0 right-0 flex flex-col items-center justify-center 
    bg-blue-500 text-white rounded-lg p-4 text-xl"
    initial={{ y: "100%" }}
    animate={{ y: "0%" }}
    exit={{ y: "100%" }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    <div className="flex items-center px-4 max-w-full mb-3">
      <div className="overflow-hidden text-center">
        <span>Het antwoord was </span>
        <span className="pl-1 font-extrabold block">{answer}</span>
        <span className="mt-2 block">Had je het goed?</span>
      </div>
    </div>
    <div className="flex gap-3 mt-2">
      <Button1
        onClick={onCorrect}
        text="Ja"
      />
      <Button1
        onClick={onIncorrect}
        text="Nee"
      />
    </div>
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
  rawlistdata,
  onCorrectAnswer,
  onWrongAnswer,
  onProgressUpdate
}: {
  mode: "toets" | "gedachten" | "hints" | "learn" | "multikeuze";
  rawlistdata: any[];
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
  onProgressUpdate?: (completed: number, total: number) => void;
}) => {
  // Use useCallback for this function since it's used in initialization
  const shuffleArray = useCallback(<T,>(array: T[]): T[] =>
    [...array].sort(() => Math.random() - 0.5),
    []);

  // Use useMemo for initial data processing
  const initialMappedData = useMemo(() => {
    if (!rawlistdata || !Array.isArray(rawlistdata) || rawlistdata.length === 0) {
      return [];
    }

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
  const [showGedachtenOverlay, setShowGedachtenOverlay] = useState(false);

  // Use an effect to clear the input field when the current question changes
  const [currentQuestion, setCurrentQuestion] = useState<string>("");

  // Watch for changes in the current question and clear input when it changes
  useEffect(() => {
    if (lijstData.length > 0 && lijstData[0]?.vraag !== currentQuestion) {
      setCurrentQuestion(lijstData[0]?.vraag || "");
      setUserInput("");
    }
  }, [lijstData]);

  // Call this when a question is processed (either right or wrong)
  const updateProgress = useCallback(() => {
    if (onProgressUpdate && initialMappedData.length > 0) {
      const total = initialMappedData.length;
      const completed = total - lijstData.length;
      onProgressUpdate(completed, total);
    }
  }, [initialMappedData.length, lijstData.length, onProgressUpdate]);

  // Track progress whenever questions are answered
  useEffect(() => {
    if (onProgressUpdate && initialMappedData.length > 0) {
      const total = initialMappedData.length;
      const completed = total - lijstData.length;
      onProgressUpdate(completed, total);
    }
  }, [lijstData.length, initialMappedData.length, onProgressUpdate]);

  // Use useCallback for event handlers that are passed to child components
  const antwoordFoutVolgende = useCallback(() => {
    if (lijstData.length > 0) {
      const [huidigeVraag, ...rest] = lijstData;
      setLijstData([...rest, huidigeVraag]);
      // Force clear the input field when moving to next question
      setTimeout(() => {
        setUserInput("");
      }, 100);
    }
    setToonAntwoord(false);
  }, [lijstData]);

  const handleAntwoordControleren = useCallback(() => {
    if (!lijstData.length || userInput.trim() === "") return;
    const [huidigeVraag, ...rest] = lijstData;
    if (userInput.trim().toLowerCase() === huidigeVraag.antwoord.toLowerCase()) {
      setShowCorrect(true);
      if (onCorrectAnswer) onCorrectAnswer();
      updateProgress();
      setTimeout(() => {
        setShowCorrect(false);
        setLijstData(shuffleArray(rest));
        setUserInput("");
      }, 2000);
    } else {
      setToonAntwoord(true);
      if (onWrongAnswer) onWrongAnswer();
      updateProgress();
      setTimeout(() => {
        antwoordFoutVolgende();
        setUserInput(""); // Clear input after wrong answer too
      }, 3500); // Increased from 2000 to 3500ms for incorrect answers
    }
  }, [lijstData, userInput, shuffleArray, antwoordFoutVolgende, onCorrectAnswer, onWrongAnswer, updateProgress]);

  const handleAntwoordControlerenGedachten = useCallback((isAntwoordCorrect: boolean) => {
    if (!lijstData.length) return;
    const [huidigeVraag, ...rest] = lijstData;
    if (isAntwoordCorrect) {
      setShowCorrect(true);
      if (onCorrectAnswer) onCorrectAnswer();
      updateProgress();
      setTimeout(() => {
        setShowCorrect(false);
        setLijstData(shuffleArray(rest));
      }, 2000);
    } else {
      if (onWrongAnswer) onWrongAnswer();
      updateProgress();
      antwoordFoutVolgende();
    }
  }, [lijstData, shuffleArray, antwoordFoutVolgende, onCorrectAnswer, onWrongAnswer, updateProgress]);

  const handleAntwoordmultikeuze = useCallback((isAntwoordCorrect: boolean) => {
    if (!lijstData.length || isAnswering) return;
    setIsAnswering(true);
    const [huidigeVraag, ...rest] = lijstData;
    if (isAntwoordCorrect) {
      setShowCorrect(true);
      if (onCorrectAnswer) onCorrectAnswer();
      updateProgress();
      setTimeout(() => {
        setShowCorrect(false);
        setLijstData(shuffleArray(rest));
        setRandomNumber(Math.floor(Math.random() * 4) + 1);
        setIsAnswering(false);
      }, 2000);
    } else {
      setToonAntwoord(true);
      if (onWrongAnswer) onWrongAnswer();
      updateProgress();
      setTimeout(() => {
        antwoordFoutVolgende();
        setRandomNumber(Math.floor(Math.random() * 4) + 1);
        setIsAnswering(false);
      }, 3500); // Increased from 2000 to 3500ms for incorrect answers
    }
  }, [lijstData, isAnswering, shuffleArray, antwoordFoutVolgende, onCorrectAnswer, onWrongAnswer, updateProgress]);

  // Handle showing the answer in gedachten mode
  const handleShowGedachtenAnswer = useCallback(() => {
    if (!lijstData.length) return;
    setShowGedachtenOverlay(true);
  }, [lijstData]);

  // Completely rewrite gedachten mode handlers to avoid any possibility of showing other overlays
  const handleGedachtenCorrect = useCallback(() => {
    if (!lijstData.length) return;

    // First dismiss the overlay
    setShowGedachtenOverlay(false);

    // Call the onCorrectAnswer callback
    if (onCorrectAnswer) onCorrectAnswer();
    updateProgress();

    // Use setTimeout to ensure state changes don't interfere with each other
    setTimeout(() => {
      const [_, ...rest] = lijstData;
      // Move directly to the next question without triggering any other overlays
      setLijstData(shuffleArray(rest));
    }, 50);
  }, [lijstData, shuffleArray, onCorrectAnswer, updateProgress]);

  const handleGedachtenIncorrect = useCallback(() => {
    if (!lijstData.length) return;

    // First dismiss the overlay
    setShowGedachtenOverlay(false);

    // Call the onWrongAnswer callback
    if (onWrongAnswer) onWrongAnswer();
    updateProgress();

    // Use setTimeout to ensure state changes don't interfere with each other
    setTimeout(() => {
      const [huidigeVraag, ...rest] = lijstData;
      // Move the question to the end without triggering any other overlays
      setLijstData([...rest, huidigeVraag]);
    }, 50);
  }, [lijstData, onWrongAnswer, updateProgress]);

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
    <div className='bg-neutral-800 relative min-w-[240px] w-full max-w-[600px] h-auto min-h-[240px] max-h-[350px] rounded-lg flex flex-col justify-center overflow-hidden'>
      {initialMappedData.length === 0 ? (
        <div className="text-center text-white p-4">
          <div className="font-bold text-xl mb-2">No list data available</div>
          <div className="text-gray-400">Please check that you have valid data in this list</div>
          <div className="text-gray-500 mt-4">Debug info: </div>
          <div className="text-gray-500 text-xs mt-1">Raw data length: {rawlistdata?.length || 0}</div>
          <div className="text-gray-500 text-xs">Mode: {mode}</div>
        </div>
      ) : lijstData.length === 0 ? (
        <div className="text-center text-white p-4">
          <div className="font-bold text-xl mb-2">Gefeliciteerd!</div>
            <div>Je hebt de lijst helemaal af!</div>
            <div className='space-x-2'>
              <Button1 onClick={() => setLijstData(shuffleArray(initialMappedData))} text="Opnieuw beginnen" className="mt-4" />
              <Button1 text={"Terug naar home "} redirectTo='/home/start' useClNav={true} />
            </div>
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center p-4 h-full'>
          <QuestionDisplay question={lijstData[0]?.vraag || ""} />

          {mode === "toets" && (
            <div className="w-full max-w-md">
              <Input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type je antwoord hier..."
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAntwoordControleren();
                  }
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button1 onClick={handleAntwoordControleren} text="Controleren" className="flex-1" />
              </div>
            </div>
          )}

          {mode === "multikeuze" && (
            <div className="grid grid-cols-2 gap-2 w-full max-w-md mt-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <MultiChoiceButton
                  key={index}
                  onClick={() => handleAntwoordmultikeuze(randomNumber === index + 1)}
                  isCorrect={randomNumber === index + 1}
                  optionNumber={index + 1}
                  text={getOptionText(index + 1, lijstData[0]?.antwoord || "")}
                  disabled={isAnswering}
                />
              ))}
            </div>
          )}

          {mode === "gedachten" && (
            <div className="flex gap-2 mt-4 w-full max-w-md">
              <Button1
                onClick={handleShowGedachtenAnswer}
                text="Toon Antwoord"
                className="flex-1"
              />
            </div>
          )}

          {mode === "hints" && (
            <div className="w-full max-w-md">
              <div className="flex flex-col gap-2 mt-4">
                <Button1
                  onClick={() => setToonAntwoord(true)}
                  text="Toon Antwoord"
                  className="w-full"
                />
                {toonAntwoord && (
                  <div className="p-4 bg-neutral-700 rounded-lg text-center">
                    <ScrollableAnswer text={lijstData[0]?.antwoord || ""} />
                  </div>
                )}
                {toonAntwoord && (
                  <div className="flex gap-2 mt-2">
                    <Button1
                      onClick={() => {
                        const [_, ...rest] = lijstData;
                        setLijstData(shuffleArray(rest));
                        setToonAntwoord(false);
                      }}
                      text="Correct"
                      className="flex-1"
                    />
                    <Button1
                      onClick={antwoordFoutVolgende}
                      text="Incorrect"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <AnimatePresence>
        {toonAntwoord && (
          <AnswerOverlay correct={false} answer={lijstData[0]?.antwoord} />
        )}
        {showCorrect && <AnswerOverlay correct={true} />}
        {showGedachtenOverlay && lijstData.length > 0 && (
          <GedachtenOverlay
            answer={lijstData[0]?.antwoord || ""}
            onCorrect={handleGedachtenCorrect}
            onIncorrect={handleGedachtenIncorrect}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(LearnTool);
