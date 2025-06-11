"use client";

import { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { updateDailyStreak } from '@/components/streak/updateStreak';
import { invalidateStreakCache } from '@/components/streak/streakClient';
import dynamic from 'next/dynamic';

// Import Lottie dynamically to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
});

import check from '@/app/img/check.svg';
import wrong from '@/app/img/wrong.svg';
import Button1 from "@/components/button/Button1";

function verwijderSpecialeTekens(tekst: string): string {
  return tekst.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
}

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
      } text-white rounded-lg text-2xl font-extrabold max-h-[60vh]`}
    initial={{ y: "100%" }}
    animate={{ y: "0%" }}
    exit={{ y: "100%" }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    <div className="w-full py-4 max-h-[inherit] overflow-y-auto">
      {correct ? (
        <div className="flex items-center justify-center">
          <Image src={check} width={40} height={40} alt="check icon" className="mr-4" />
          Correct!
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-start px-4 w-full py-2">
          <Image src={wrong} width={40} height={40} alt="wrong icon" className="mr-4 flex-shrink-0 mb-2 md:mb-0 mt-1" />
          <div className="w-full text-center md:text-left">
            <span>Verkeerd! het antwoord was </span>
            <span className="pl-1 font-extrabold break-words">{answer}</span>
          </div>
        </div>
      )}
    </div>
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
    bg-blue-500 text-white rounded-lg max-h-[60vh]"
    initial={{ y: "100%" }}
    animate={{ y: "0%" }}
    exit={{ y: "100%" }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    <div className="w-full p-4 max-h-[inherit] overflow-y-auto">
      <div className="flex flex-col items-center px-4 max-w-full mb-3">
        <div className="overflow-hidden text-center">
          <span>Het antwoord was </span>
          <span className="pl-1 font-extrabold block break-words">{answer}</span>
          <span className="mt-2 block">Had je het goed?</span>
        </div>
      </div>
      <div className="flex gap-3 mt-2 justify-center">
        <Button1
          onClick={onCorrect}
          text="Ja"
        />
        <Button1
          onClick={onIncorrect}
          text="Nee"
        />
      </div>
    </div>
  </motion.div>
));

// Replace the modal StreakScreen with an inline version
const StreakCelebration = memo(({ streak, isNewStreak }: {
  streak: number;
  isNewStreak: boolean;
}) => {
  // Fix the type to accept any animation data
  const [animation, setAnimation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load animation on component mount
  useEffect(() => {
    // Preload the animation as early as possible
    const loadAnimation = async () => {
      try {
        // Add a slight delay to ensure component is fully mounted
        await new Promise(resolve => setTimeout(resolve, 10));
        const animationModule = await import('@/app/img/flame.json');
        setAnimation(animationModule.default);
        // Add a slight delay before showing to ensure smooth transition
        setTimeout(() => setIsLoading(false), 50);
      } catch (error) {
        console.error("Failed to load animation:", error);
        setIsLoading(false); // Show fallback on error
      }
    };

    loadAnimation();

    // Clean up any pending timeouts on unmount
    return () => {
      setAnimation(null);
    };
  }, []);

  return (
    <div className="w-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500 rounded-xl p-6 my-4">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 mb-2 relative flex items-center justify-center">

          <Lottie animationData={animation} loop={true} />
        </div>

        <h2 className="text-2xl font-bold mb-2 text-white text-center">
          Je hebt een reeks gestart!
        </h2>

        <div className="text-5xl font-bold text-orange-400 my-4 text-center">
          {streak} <span className="text-lg">{streak === 1 ? 'dag' : 'dagen'}</span>
        </div>

        <p className="text-center text-gray-300">
          Je bent goed bezig! Blijf elke dag leren om je reeks te behouden.
        </p>
      </div>
    </div>
  );
});

// Update FreezeReward to be an inline component like StreakCelebration
const FreezeReward = memo(({ streak }: { streak: number }) => {

  return (
    <div className="w-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500 rounded-xl p-6 my-4">
      <div className="flex flex-col items-center">

        <h2 className="text-2xl font-bold mb-2 text-white text-center">
          Bevriezer verdiend!
        </h2>

        <div className="text-6xl font-bold text-blue-400 my-4 text-center">
          🧊
        </div>

        <p className="text-center text-gray-300">
          Je hebt 3 dagen achter elkaar geleerd. Je hebt een bevriezer verdiend!
          Dit kan je gebruiken om je reeks te behouden als je een dag mist.
        </p>
      </div>
    </div>
  );
});

// Add another variant of the freeze component for when a freeze is used
const FreezeUsed = memo(({ streak }: { streak: number }) => {
  return (
    <div className="w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500 rounded-xl p-6 my-4">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-white text-center">
          Bevriezer gebruikt!
        </h2>

        <div className="text-6xl font-bold text-indigo-400 my-4 text-center">
          🧊❄️
        </div>

        <p className="text-center text-gray-300">
          Je miste een dag, maar we hebben een bevriezer gebruikt om je reeks van {streak} {streak === 1 ? 'dag' : 'dagen'} te redden!
        </p>
      </div>
    </div>
  );
});

// Memoize the multi-choice button component
const MultiChoiceButton = memo(({ onClick, isCorrect, optionNumber, text, disabled }: {
  onClick: () => void;
  isCorrect: boolean;
  optionNumber: number;
  text: string;
  disabled: boolean;
}) => {
  const needsClamp = text.length > 40;
  return (
    <div className="relative transform-gpu h-full w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full h-full">
              <Button1
                onClick={onClick}
                disabled={disabled}
                text={text}
                wrapText={needsClamp}
                textClassName="text-sm"
                className="w-full border border-neutral-700"
              />
            </div>
          </TooltipTrigger>
          {needsClamp && (
            <TooltipContent
              className="z-[999] bg-neutral-900 border border-neutral-700 text-white max-w-xs text-xs p-2 whitespace-normal break-words"
            >
              {text}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});

const getHint = (answer: string): string => {
  if (!answer || answer.length === 0) return '';

  // Make a working copy to avoid modifying original
  let workingAnswer = answer;

  // Handle parenthesized content - either show it as optional or remove it
  // based on the existing logic in handleAntwoordControleren
  if (answer.includes("(") && answer.includes(")")) {
    // Show parenthesized content as optional in hint
    workingAnswer = workingAnswer.replace(/\(([^)]+)\)/g, '($1)');
  }

  // Check if the answer has multiple options (separated by slash or "of")
  if (workingAnswer.includes("/") || workingAnswer.includes(" of ")) {
    const parts = workingAnswer.split(/\s*(?:of|\/)\s*/);

    // Generate a hint for each alternative answer
    const hints = parts.map(part => {
      return part.trim().split(' ').map(word => {
        if (word.length === 0) return '';
        return word.charAt(0) + '_'.repeat(word.length - 1);
      }).join(' ');
    });

    // Join the hints with the same separator that was in the original answer
    return workingAnswer.includes("/") ? hints.join(' / ') : hints.join(' of ');
  }

  // Original behavior for single answers
  return workingAnswer.split(' ').map(word => {
    if (word.length === 0) return '';
    return word.charAt(0) + '_'.repeat(word.length - 1);
  }).join(' ');
};

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
  // Seeded random number generator for deterministic results
  const seededRandom = useCallback((seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }, []);

  // Create a deterministic shuffle based on list content
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    if (array.length === 0) return array;

    // Create a seed based on the array content for deterministic results
    let seed = 0;
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (item && typeof item === 'object') {
        // Type-safe property access
        const str = ((item as any).vraag || (item as any)["1"] || "") +
          ((item as any).antwoord || (item as any)["2"] || "");
        for (let j = 0; j < str.length; j++) {
          seed = ((seed << 5) - seed + str.charCodeAt(j)) & 0xffffffff;
        }
      } else {
        const str = String(item || "");
        for (let j = 0; j < str.length; j++) {
          seed = ((seed << 5) - seed + str.charCodeAt(j)) & 0xffffffff;
        }
      }
    }

    // Use seeded random for deterministic shuffle
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seed + i) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [seededRandom]);

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

  // Initialize data with deterministic values to prevent hydration mismatch
  const [lijstData, setLijstData] = useState<any[]>(() => {
    if (!rawlistdata || !Array.isArray(rawlistdata) || rawlistdata.length === 0) {
      return [];
    }
    // Use deterministic shuffling based on content
    const mappedData = rawlistdata
      .map(item => ({
        vraag: item.vraag || item["1"] || "",
        antwoord: item.antwoord || item["2"] || ""
      }))
      .filter(item => item.vraag && item.antwoord);

    // Generate deterministic seed from content
    let seed = 0;
    for (const item of mappedData) {
      const str = (item.vraag || "") + (item.antwoord || "");
      for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
      }
    }

    // Deterministic shuffle using seeded random
    const shuffled = [...mappedData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      let x = Math.sin(seed + i) * 10000;
      const random = x - Math.floor(x);
      const j = Math.floor(random * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  const [lijstDataOud, setLijstDataOud] = useState<any[]>(() => lijstData);
  const [userInput, setUserInput] = useState("");
  const [toonAntwoord, setToonAntwoord] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);

  // Initialize random number deterministically
  const [randomNumber, setRandomNumber] = useState<number>(() => {
    if (!rawlistdata || !Array.isArray(rawlistdata) || rawlistdata.length === 0) {
      return 1;
    }
    let seed = 0;
    for (const item of rawlistdata.slice(0, 5)) {
      const str = ((item.vraag || item["1"]) || "") + ((item.antwoord || item["2"]) || "");
      for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
      }
    }
    let x = Math.sin(seed) * 10000;
    const random = x - Math.floor(x);
    return Math.floor(random * 4) + 1;
  });

  const [isAnswering, setIsAnswering] = useState(false);
  const [showGedachtenOverlay, setShowGedachtenOverlay] = useState(false);
  const [streakInfo, setStreakInfo] = useState<{ currentStreak: number; isNewStreak: boolean }>({
    currentStreak: 0,
    isNewStreak: false
  });
  const [listCompleted, setListCompleted] = useState(false);
  const [streakUpdated, setStreakUpdated] = useState(false);
  const [streakStarted, setStreakStarted] = useState(false);
  const [freezeAwarded, setFreezeAwarded] = useState(false);
  const [freezeUsed, setFreezeUsed] = useState(false);
  const [locked, setLocked] = useState(false);

  // Generate deterministic random number for multiple choice
  const generateRandomNumber = useCallback(() => {
    // Use current question content as seed for consistency
    let seed = 0;
    if (lijstData.length > 0) {
      const currentItem = lijstData[0];
      const str = (currentItem?.vraag || "") + (currentItem?.antwoord || "");
      for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
      }
      // Add current list length to vary the seed when questions change
      seed += lijstData.length;
    }
    return Math.floor(seededRandom(seed) * 4) + 1;
  }, [lijstData, seededRandom]);

  // Refs for input elements to enable autofocus
  const toetsInputRef = useRef<HTMLInputElement>(null);
  const hintsInputRef = useRef<HTMLInputElement>(null);

  // Note: No longer needed with SSR-compatible initialization
  const [currentQuestion, setCurrentQuestion] = useState<string>("");

  // Watch for changes in the current question and clear input when it changes
  useEffect(() => {
    if (lijstData.length > 0 && lijstData[0]?.vraag !== currentQuestion) {
      setCurrentQuestion(lijstData[0]?.vraag || "");
      setUserInput("");
    }
  }, [lijstData, currentQuestion]);

  // Sync the locked state with overlay visibility
  useEffect(() => {
    const anyOverlayVisible = toonAntwoord || showCorrect || showGedachtenOverlay;
    setLocked(anyOverlayVisible);
  }, [toonAntwoord, showCorrect, showGedachtenOverlay]);

  // Autofocus input when unlocked or when question changes
  useEffect(() => {
    if (!locked && lijstData.length > 0) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        if (mode === "toets" && toetsInputRef.current) {
          toetsInputRef.current.focus();
        } else if (mode === "hints" && hintsInputRef.current) {
          hintsInputRef.current.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [locked, mode, lijstData.length, currentQuestion]);



  // Handle focus and keyboard events when locked
  useEffect(() => {
    if (locked) {
      // Remove focus from any active element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Handle keyboard events while locked
      const handleKeyDown = (e: KeyboardEvent) => {
        // Allow Enter key to dismiss overlays and immediately move to next question
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();

          // Handle overlays in priority order and immediately progress
          if (showGedachtenOverlay) {
            // For gedachten overlay, Enter doesn't dismiss it as user needs to choose yes/no
            return;
          } else if (toonAntwoord) {
            // Handle wrong answer overlay - immediately move question to end
            setToonAntwoord(false);
            if (lijstData.length > 0) {
              const [huidigeVraag, ...rest] = lijstData;
              setLijstData([...rest, huidigeVraag]);
              setUserInput("");
            }
          } else if (showCorrect) {
            // Handle correct answer overlay - immediately move to next question
            setShowCorrect(false);
            if (lijstData.length > 0) {
              const [, ...rest] = lijstData;
              setLijstData(shuffleArray(rest));
              setUserInput("");
              // For multiple choice, generate new random number
              if (mode === "multikeuze") {
                setRandomNumber(generateRandomNumber());
                setIsAnswering(false);
              }
            }
          }
        } else {
          // Prevent other keyboard actions
          e.preventDefault();
          e.stopPropagation();
        }
      };

      // Add a global event listener with capture phase
      window.addEventListener('keydown', handleKeyDown, true);

      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [locked, toonAntwoord, showCorrect, showGedachtenOverlay, lijstData, shuffleArray, setUserInput, mode, generateRandomNumber]);

  // Auto-dismiss correct overlay after 1 second
  useEffect(() => {
    if (showCorrect) {
      const timer = setTimeout(() => {
        setShowCorrect(false);
        if (lijstData.length > 0) {
          const [, ...rest] = lijstData;
          const nextList = shuffleArray(rest);
          setLijstData(nextList);
          setUserInput("");
          if (mode === "multikeuze") {
            setRandomNumber(generateRandomNumber());
            setIsAnswering(false);
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showCorrect, lijstData, shuffleArray, generateRandomNumber, mode]);

  // Auto-dismiss incorrect overlay after 5 seconds
  useEffect(() => {
    if (toonAntwoord) {
      const timer = setTimeout(() => {
        setToonAntwoord(false);
        if (lijstData.length > 0) {
          const [current, ...rest] = lijstData;
          setLijstData([...rest, current]);
          setUserInput("");
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toonAntwoord, lijstData]);

  // Allow keyboard interactions for gedachten overlay
  useEffect(() => {
    if (showGedachtenOverlay) {
      // Allow keyboard events specifically for the gedachten overlay
      // This creates a separate effect that doesn't interfere with the locked effect
      const handleGedachtenKeyDown = (e: KeyboardEvent) => {
        // Allow key events for the Yes/No buttons but protect against unwanted key events
        if (!['Tab', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
        }
      };

      window.addEventListener('keydown', handleGedachtenKeyDown, false);

      return () => {
        window.removeEventListener('keydown', handleGedachtenKeyDown, false);
      };
    }
  }, [showGedachtenOverlay]);

  // Add an effect to update streak when the list is completed
  useEffect(() => {
    // Only run when the list changes from not-completed to completed
    if (initialMappedData.length > 0 && lijstData.length === 0 && !listCompleted) {
      setListCompleted(true);

      const updateStreak = async () => {
        const result = await updateDailyStreak();
        if (result.success) {
          setStreakInfo({
            currentStreak: result.currentStreak || 0,
            isNewStreak: result.isNewStreak === true
          });

          // Track if the streak was updated for potential UI changes
          setStreakUpdated(result.streakUpdated === true);

          // Track if a freeze was awarded or used
          setFreezeAwarded(result.freezeAwarded === true);
          setFreezeUsed(result.freezeUsed === true);

          // Determine which screen to show first
          if (result.streakUpdated && result.isNewStreak) {
            setStreakStarted(true);
          }

          // Invalidate the streak cache to update the UI
          invalidateStreakCache();
        }
      };

      updateStreak();
    }
  }, [lijstData.length, initialMappedData.length, listCompleted]);

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

  const handleAntwoordControleren = useCallback(() => {
    // Don't process if locked (overlay is showing) or no input
    if (locked || !lijstData.length || userInput.trim() === "") return;

    const [huidigeVraag, ...rest] = lijstData;
    let huidigAntwoordZonderSpecialeTekens = verwijderSpecialeTekens(huidigeVraag.antwoord);
    let userInputZonderSpecialeTekens = verwijderSpecialeTekens(userInput);
    let userInputCorrect = false;

    // simple goed antwoord
    if (huidigAntwoordZonderSpecialeTekens === userInputZonderSpecialeTekens) {
      userInputCorrect = true;
    }
    // goed antwoord met "of" of "/"
    if (huidigeVraag.antwoord.includes("of") || huidigeVraag.antwoord.includes("/")) {
      const antwoorden = huidigeVraag.antwoord.split(/\s*(?:of|\/)\s*/).map((antwoord: string) => antwoord.trim());
      antwoorden.forEach((antwoord: string) => {
        if (userInputZonderSpecialeTekens.trim() === verwijderSpecialeTekens(antwoord).trim()) {
          userInputCorrect = true;
          return;
        }
      });
    }
    // goed antwoord zonder dingen tussen haakjes
    if (huidigeVraag.antwoord.includes("(") && huidigeVraag.antwoord.includes(")")) {
      const antwoordZonderHaakjes = huidigeVraag.antwoord.replace(/\(.*?\)/g, "").trim();
      if (userInputZonderSpecialeTekens === verwijderSpecialeTekens(antwoordZonderHaakjes)) {
        userInputCorrect = true;
      }
    }

    if (userInputCorrect) {
      setShowCorrect(true);
      if (onCorrectAnswer) onCorrectAnswer();
      updateProgress();
      // No timeout - let Enter key handle progression
    } else {
      setToonAntwoord(true);
      if (onWrongAnswer) onWrongAnswer();
      updateProgress();
      // No timeout - let Enter key handle progression
    }
  }, [lijstData, userInput, onCorrectAnswer, onWrongAnswer, updateProgress, locked]);

  // Renamed from handleAntwoordControlerenGedachten
  const handleSelfAssessment = useCallback((isAntwoordCorrect: boolean) => {
    if (!lijstData.length) return;

    // Dismiss the overlay first
    setShowGedachtenOverlay(false);

    const [huidigeVraag, ...rest] = lijstData;
    if (isAntwoordCorrect) {
      // Call the onCorrectAnswer callback
      if (onCorrectAnswer) onCorrectAnswer();
      updateProgress();

      // Use setTimeout to ensure state changes don't interfere
      setTimeout(() => {
        setLijstData(shuffleArray(rest));
      }, 50); // Short delay
    } else {
      // Call the onWrongAnswer callback
      if (onWrongAnswer) onWrongAnswer();
      updateProgress();

      // Use setTimeout to ensure state changes don't interfere
      setTimeout(() => {
        // Move the question to the end
        setLijstData([...rest, huidigeVraag]);
      }, 50); // Short delay
    }
  }, [lijstData, shuffleArray, onCorrectAnswer, onWrongAnswer, updateProgress]);

  const handleAntwoordmultikeuze = useCallback((isAntwoordCorrect: boolean) => {
    if (!lijstData.length || isAnswering || locked) return;
    setIsAnswering(true);

    if (isAntwoordCorrect) {
      setShowCorrect(true);
      if (onCorrectAnswer) onCorrectAnswer();
      updateProgress();
      // No timeout - let Enter key handle progression
    } else {
      setToonAntwoord(true);
      if (onWrongAnswer) onWrongAnswer();
      updateProgress();
      // No timeout - let Enter key handle progression
    }
  }, [lijstData, isAnswering, onCorrectAnswer, onWrongAnswer, updateProgress, locked]);

  // Handle showing the answer in gedachten mode
  const handleShowGedachtenAnswer = useCallback(() => {
    if (!lijstData.length || locked) return;
    setShowGedachtenOverlay(true);
  }, [lijstData, locked]);

  // Use useMemo for derived calculations
  const getOptionText = useCallback((buttonNumber: number, correctAnswer: string): string => {
    if (randomNumber === buttonNumber) {
      return correctAnswer;
    }

    if (lijstDataOud.length < 2) {
      return "Optie";
    }

    // Generate deterministic seed for wrong option selection
    let seed = buttonNumber * 1000; // Base seed on button number
    const str = correctAnswer;
    for (let i = 0; i < str.length; i++) {
      seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
    }

    let attempts = 0;
    let randomAnswer = "";

    do {
      if (attempts > 10) {
        const randomIndex = Math.floor(seededRandom(seed + attempts) * lijstDataOud.length);
        return lijstDataOud[randomIndex]?.antwoord || "Optie";
      }

      attempts++;
      const randomIndex = Math.floor(seededRandom(seed + attempts) * lijstDataOud.length);
      randomAnswer = lijstDataOud[randomIndex]?.antwoord || "";
    } while (randomAnswer.toLowerCase() === correctAnswer.toLowerCase() || randomAnswer === "");

    return randomAnswer;
  }, [randomNumber, lijstDataOud, seededRandom]);

  return (
    <div className="bg-neutral-800 relative min-w-[240px] w-full max-w-[600px] h-[60vh] rounded-lg flex flex-col justify-center overflow-hidden p-4">
      {/* Add a subtle grayed-out overlay when locked */}
      {locked && (
        <div
          className="absolute inset-0 bg-neutral-800 opacity-40 z-40 pointer-events-none"
          aria-hidden="true"
        />
      )}
      {initialMappedData.length === 0 ? (
        <div className="text-center text-white p-4">
          Lijst niet gevonden
        </div>
      ) : lijstData.length === 0 ? (
        <div className="text-center text-white p-4 overflow-y-auto max-h-full">
          <div className="font-bold text-xl mb-2">Gefeliciteerd!</div>
          <div>Je hebt de lijst helemaal af!</div>

          {/* Show freeze used message if a freeze was used */}
          {freezeUsed && (
            <FreezeUsed streak={streakInfo.currentStreak} />
          )}

          {/* Show freeze award if earned */}
          {freezeAwarded && (
            <FreezeReward streak={streakInfo.currentStreak} />
          )}

          {/* Show streak celebration directly in the completion screen if a streak started */}
          {streakStarted && (
            <StreakCelebration
              streak={streakInfo.currentStreak}
              isNewStreak={true}
            />
          )}

          <div className='space-x-2 mt-4'>
            <Button1 onClick={() => {
              setLijstData(shuffleArray(initialMappedData));
              // Generate new deterministic random number
              setRandomNumber(generateRandomNumber());
              setListCompleted(false);
              setStreakUpdated(false);
              setStreakStarted(false);
              setFreezeAwarded(false);
              setFreezeUsed(false);
            }} text="Opnieuw beginnen" className="mt-4" />
            <Button1 text={"Terug naar home"} redirectTo='/home/start' useClNav={true} />
          </div>
        </div>
      ) : lijstData.length > 0 ? (
        <div className='flex flex-col items-center justify-center h-full'>
          <QuestionDisplay question={lijstData[0]?.vraag || ""} />

          {mode === "toets" && (
            <div className="w-full max-w-md">
              <Input
                ref={toetsInputRef}
                type="text"
                value={userInput}
                onChange={(e) => !locked && setUserInput(e.target.value)}
                placeholder="Type je antwoord hier..."
                className={`w-full ${locked ? 'cursor-not-allowed opacity-70' : ''}`}
                disabled={locked}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !locked) {
                    handleAntwoordControleren();
                  }
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button1
                  onClick={!locked ? handleAntwoordControleren : undefined}
                  text="Controleren"
                  className={`flex-1 ${locked ? 'opacity-70' : ''}`}
                  disabled={locked}
                />
              </div>
            </div>
          )}

          {mode === "multikeuze" && (
            <div className="grid grid-cols-2 gap-2 w-full max-w-md mt-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-auto min-h-[80px]">
                  <MultiChoiceButton
                    onClick={() => !locked && handleAntwoordmultikeuze(randomNumber === index + 1)}
                    isCorrect={randomNumber === index + 1}
                    optionNumber={index + 1}
                    text={getOptionText(index + 1, lijstData[0]?.antwoord || "")}
                    disabled={isAnswering || locked}
                  />
                </div>
              ))}
            </div>
          )}

          {mode === "gedachten" && (
            <div className="flex gap-2 mt-4 w-full max-w-md">
              <Button1
                onClick={!locked ? handleShowGedachtenAnswer : undefined}
                text="Toon Antwoord"
                className={`flex-1 ${locked ? 'opacity-70' : ''}`}
                disabled={locked}
              />
            </div>
          )}
          {mode === "learn" && (
            <div className="flex gap-2 mt-4 w-full max-w-md">
              <Button1
                onClick={!locked ? handleShowGedachtenAnswer : undefined} // Re-use the same handler as gedachten
                text="Toon Antwoord"
                className={`flex-1 ${locked ? 'opacity-70' : ''}`}
                disabled={locked}
              />
            </div>
          )}

          {mode === "hints" && (
            <div className="w-full max-w-md">
              <div className="p-4 bg-neutral-700 rounded-lg text-center mb-4 max-h-[120px] overflow-y-auto">
                <span className="font-extrabold break-words whitespace-pre-wrap">Hint: {getHint(lijstData[0]?.antwoord || "")}</span>
              </div>
              <Input
                ref={hintsInputRef}
                type="text"
                value={userInput}
                onChange={(e) => !locked && setUserInput(e.target.value)}
                placeholder="Type je antwoord hier..."
                className={`w-full ${locked ? 'cursor-not-allowed opacity-70' : ''}`}
                disabled={locked}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !locked) {
                    handleAntwoordControleren();
                  }
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button1
                  onClick={!locked ? handleAntwoordControleren : undefined}
                  text="Controleren"
                  className={`flex-1 ${locked ? 'opacity-70' : ''}`}
                  disabled={locked}
                />
              </div>
            </div>
          )}
        </div>
      ) : null}

      <AnimatePresence>
        {toonAntwoord && (
          <AnswerOverlay correct={false} answer={lijstData[0]?.antwoord} />
        )}
        {showCorrect && <AnswerOverlay correct={true} />}
        {showGedachtenOverlay && lijstData.length > 0 && (
          <GedachtenOverlay
            answer={lijstData[0]?.antwoord || ""}
            onCorrect={() => handleSelfAssessment(true)}
            onIncorrect={() => handleSelfAssessment(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(LearnTool);
