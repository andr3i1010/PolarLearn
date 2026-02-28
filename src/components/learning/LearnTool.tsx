"use client";
import Celebration from "@/components/streak/Celebration";
import { useStreakUpdate } from "@/hooks/useStreakUpdate";
import { useStreak } from "@/store/streak/StreakProvider";
import React, { useState, useEffect, useRef } from "react";
import { useListStore } from "./listStore";
import Button1 from "@/components/button/Button1";
import { Input } from "../ui/input";
import { detectTypfout } from "./typfout";
import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import { Progress } from "../ui/progress";
import { motion, AnimatePresence } from "motion/react";
import { saveLearnSession } from "@/utils/saveLearnSession";
import type { ListStoreState } from "./listStore";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

function TypfoutScreen({
  show,
  userInput,
  correctAnswer,
  onMark,
  progress,
  showProgress,
}: {
  show: boolean;
  userInput: string;
  correctAnswer: string;
  onMark: (correct: boolean) => void;
  progress: number;
  showProgress: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="absolute inset-0 bg-yellow-500    rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-white z-20 flex-col"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: "auto" }}
          >
            <CircleAlert size={50} />
            <h1 className="text-2xl font-bold mt-2">
              Je hebt een typfout gemaakt!
            </h1>
            <div className="mt-4 text-lg">
              <span className="block">
                Ingevuld:{" "}
                <span className="font-mono bg-neutral-900/60 px-2 py-1 rounded">
                  {userInput}
                </span>
              </span>
              <span className="block mt-1">
                Verwacht:{" "}
                <span className="font-mono bg-neutral-900/60 px-2 py-1 rounded">
                  {correctAnswer}
                </span>
              </span>
            </div>
            <div className="flex gap-4 mt-6">
              <Button1 text="Goed rekenen" onClick={() => onMark(true)} />
              <Button1 text="Fout rekenen" onClick={() => onMark(false)} />
            </div>
          </motion.div>
          {showProgress && (
            <motion.div
              className="absolute bottom-4 left-4 right-4 pointer-events-none z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

function CorrectScreen({
  show,
  progress,
  showProgress,
}: {
  show: boolean;
  progress: number;
  showProgress: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="absolute inset-0 bg-green-500    rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-white pointer-events-none z-10 flex-col"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <CircleCheck size={50} />
            <h1 className="text-2xl font-bold">Correct!</h1>
          </motion.div>
          {showProgress && (
            <motion.div
              className="absolute bottom-4 left-4 right-4 pointer-events-none z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

function IncorrectScreen({
  show,
  correctAnswer,
  progress,
  showProgress,
  setIsCorrect,
}: {
  show: boolean;
  correctAnswer: string;
  progress: number;
  showProgress: boolean;
  setIsCorrect: (correct: boolean) => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="absolute inset-0 bg-red-500    rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-white pointer-events-none z-10 flex-col"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: "auto" }}
          >
            <CircleX size={50} />
            <h1 className="text-2xl font-bold">Incorrect!</h1>
            <p className="mt-2 text-lg">
              Het juiste antwoord is: <strong>{correctAnswer}</strong>
            </p>
            <div className="flex gap-4 mt-6">
              <Button1 text="Goed rekenen" onClick={() => setIsCorrect(true)} />
            </div>
          </motion.div>
          {showProgress && (
            <motion.div
              className="absolute bottom-4 left-4 right-4 pointer-events-none z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

function BlueReview({
  show,
  answer,
  onMark,
}: {
  show: boolean;
  answer: string;
  onMark: (correct: boolean) => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            // background overlay - positioned under the content
            className="absolute inset-0 bg-blue-500 rounded-lg pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            // content container - allow pointer events so buttons are clickable
            className="absolute inset-0 flex items-center justify-center text-white z-20 flex-col"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: "auto" }}
          >
            <h1 className="text-xl font-bold">Het antwoord is: </h1>
            <h1 className="text-2xl font-bold">{answer}</h1>
            <h1 className="text-xl font-bold">Had je het goed?</h1>
            <div className="flex flex-row gap-4 mt-2">
              <Button1 text="Ja" onClick={() => onMark(true)} />
              <Button1 text="Nee" onClick={() => onMark(false)} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Function to generate hint from answer
function generateHint(answer: string): string {
  if (!answer) return "";

  const words = answer.split(" ");
  return words
    .map((word) => {
      if (word.length <= 2) {
        return word; // Keep short words intact
      }

      // For longer words, show first letter and underscores for the rest
      const firstChar = word[0];
      const underscores = "_".repeat(word.length - 1);
      return firstChar + underscores;
    })
    .join(" ");
}

export default function LearnTool() {
  const storeState = useListStore();
  const {
    currentList,
    currentWord,
    currentMethod,
    mainMode,
    sessionId,
    setRandomCurrentWord,
    checkAnswer,
    answerCorrect,
    answerWrong,
    learnListQueue,
    dequeueLearnItem,
    score,
    answerLog: _answerLog,
    incorrectAnswerLog,
  } = storeState;

  const [userInput, setUserInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTypfout, setShowTypfout] = useState(false);
  const [streakUpdate, setStreakUpdate] = useState<{
    success?: boolean;
    streakUpdated?: boolean;
    currentStreak?: number;
    isNewStreak?: boolean;
  } | null>(null);
  const [progress, setProgress] = useState(100);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [cardKey, setCardKey] = useState(0); // Key to trigger card animation
  // Determine effective mode: if we're in learnlist and have a queue, use the first queue item's mode
  const queueFirst =
    learnListQueue && learnListQueue.length > 0 ? learnListQueue[0] : null;
  // Determine a canonical mode to drive the UI. The queue uses short names like 'mc'.
  const modeSource =
    currentMethod === "learnlist" && queueFirst
      ? queueFirst.mode
      : currentMethod;
  const effectiveMode = modeSource === "mc" ? "multichoice" : modeSource;
  const router = useRouter();

  // For multiple choice: options should be provided server-side on the currentWord as `options`.
  const mcOptions = Array.isArray((currentWord as any)?.options)
    ? ((currentWord as any).options as string[])
    : [];
  // Mind mode state: show blue review overlay
  const [showBlueReview, setShowBlueReview] = useState(false);

  // Ref for auto-focusing the input
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper function to save the session
  const saveSession = async (isPaused = true, isCompleted = false) => {
    if (!currentList?.list_id) {
      return;
    }

    try {
      await saveLearnSession(
        currentList.list_id,
        storeState as ListStoreState,
        isPaused,
        isCompleted,
        sessionId || undefined,
      );
    } catch (error) {
      console.error("[LearnTool] Failed to save session:", error);
    }
  };

  // Timer for overlay visibility (both correct and incorrect)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && showResult) {
      const duration = isCorrect ? 1000 : 3000; // 1.5s for correct, 3s for incorrect
      const intervalTime = 50; // Update every 50ms for smooth animation
      let timeLeft = duration;

      interval = setInterval(() => {
        timeLeft -= intervalTime;
        const progressValue = (timeLeft / duration) * 100;
        setProgress(Math.max(0, progressValue));

        if (timeLeft <= 0) {
          handleNext();
        }
      }, intervalTime);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, showResult, isCorrect]);

  // Auto-save session when queue changes (after dequeue) or when moving to next word
  const prevQueueLengthRef = useRef<number | null>(null);
  const prevWordIdRef = useRef<number | null>(null);

  useEffect(() => {
    const currentQueueLength = learnListQueue?.length ?? 0;
    const currentWordId = currentWord?.id ?? null;

    // Skip initial mount
    if (prevQueueLengthRef.current === null && prevWordIdRef.current === null) {
      prevQueueLengthRef.current = currentQueueLength;
      prevWordIdRef.current = currentWordId;
      return;
    }

    if (
      mainMode === "learnlist" &&
      learnListQueue &&
      currentQueueLength < (prevQueueLengthRef.current ?? 0)
    ) {
      saveSession(true, false);
    } else if (
      mainMode !== "learnlist" &&
      currentWordId !== prevWordIdRef.current &&
      prevWordIdRef.current !== null
    ) {
      saveSession(true, false);
    }

    prevQueueLengthRef.current = currentQueueLength;
    prevWordIdRef.current = currentWordId;
  }, [learnListQueue?.length, currentWord?.id, mainMode]);

  // Global handler: when an overlay is visible (result screens), allow Enter to advance
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      // if an input or textarea is focused, don't hijack Enter (let onKeyPress handle it)
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
      )
        return;

      // if typfout overlay is visible, we don't advance here (user should choose Good/Wrong)
      if (showTypfout) return;

      if (showResult) {
        handleNext();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResult, showTypfout]);

  // Auto-focus input when a new word is shown
  useEffect(() => {
    if (!showResult && !showTypfout && !showBlueReview && inputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [cardKey, showResult, showTypfout, showBlueReview]);

  const handleSubmit = () => {
    if (!currentWord || !userInput.trim()) return;
    const answer = currentWord["2"] || "";
    const correct = checkAnswer(userInput);
    const typfout = !correct && detectTypfout(userInput, answer);
    setIsCorrect(correct);
    if (typfout) {
      setShowTypfout(true);
      setShowResult(false);
      setIsTimerActive(false);
      return;
    }
    setShowResult(true);
    setProgress(100);
    setIsTimerActive(true);
    if (correct) {
      answerCorrect();
    } else {
      answerWrong(userInput);
    }
  };

  const handleDontKnow = () => {
    if (!currentWord || showResult || showTypfout || showBlueReview) return;

    setUserInput("");
    setIsCorrect(false);
    setShowTypfout(false);
    setShowResult(true);
    setProgress(100);
    setIsTimerActive(true);
    answerWrong("");
  };

  // Handler voor typfout popup
  const handleTypfoutMark = (wasCorrect: boolean) => {
    setIsCorrect(wasCorrect);
    setShowTypfout(false);
    setShowResult(true);
    setIsTimerActive(true);
    setProgress(100);
    if (wasCorrect) {
      answerCorrect();
    } else {
      answerWrong(userInput);
    }
  };

  // Handler for mind mode 'Controleer' button
  const handleMindCheck = () => {
    if (!currentWord) return;
    setShowBlueReview(true);
  };

  const handleMindMark = (wasCorrect: boolean) => {
    setIsCorrect(wasCorrect);
    if (wasCorrect) {
      answerCorrect();
    } else {
      answerWrong("");
    }

    // Reset UI state and move to next word
    setShowBlueReview(false);
    setUserInput("");
    setShowResult(false);
    setIsTimerActive(false);
    setProgress(100);

    if (learnListQueue && learnListQueue.length > 0) {
      dequeueLearnItem();
    } else {
      setRandomCurrentWord();
    }
  };

  // For multiple choice, handle clicking an option
  const handleMcClick = (option: string) => {
    if (showResult) return;
    setUserInput(option);
    const correct = checkAnswer(option);
    setIsCorrect(correct);
    setShowResult(true);
    setProgress(100);
    setIsTimerActive(true);
    if (correct) {
      answerCorrect();
    } else {
      answerWrong(option);
    }
  };
  const handleNext = () => {
    setUserInput("");
    setShowResult(false);
    setIsTimerActive(false);
    setProgress(100);
    setShowBlueReview(false);

    // Trigger card animation
    setCardKey((prev) => prev + 1);

    if (learnListQueue && learnListQueue.length > 0) {
      dequeueLearnItem();
    } else {
      setRandomCurrentWord();
    }
  };

  const isCompleted =
    mainMode === "learnlist" && learnListQueue
      ? learnListQueue.length === 0
      : !currentList || !currentList.data?.length;

  const { handleListCompletion } = useStreakUpdate();
  const completedTriggeredRef = useRef(false);
  const [showCelebration, setShowCelebration] = useState(true);
  const currentStreakCount = useStreak(); // Get streak from store instead of API response
  const [isCalculatingStats, setIsCalculatingStats] = useState(false);

  // Check if this is a custom session (has sessionId)
  const isCustomSession = !!sessionId;

  useEffect(() => {
    if (!isCompleted || showResult) return;
    if (completedTriggeredRef.current) return;
    completedTriggeredRef.current = true;

    (async () => {
      // For custom sessions, show calculating stats message
      if (isCustomSession) {
        setIsCalculatingStats(true);
      }

      // Save the session as completed
      await saveSession(false, true);

      // Update the streak
      const result = await handleListCompletion();
      setStreakUpdate(result as any);

      if (isCustomSession) {
        setIsCalculatingStats(false);
      }
    })();
  }, [isCompleted, showResult, handleListCompletion, isCustomSession]);

  // Delete temporary sessions when user navigates away (but keep custom sessions)
  useEffect(() => {
    return () => {
      // Only delete if it's NOT a custom session and the list is completed
      if (!isCustomSession && isCompleted && currentList?.list_id) {
        // Delete the temporary session
        fetch(`/api/v1/lists/${currentList.list_id}/session`, {
          method: "DELETE",
        }).catch((err) =>
          console.error("Failed to delete temporary session:", err),
        );
      }
    };
  }, [isCompleted, currentList?.list_id, isCustomSession]);

  // Save session when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Only save if we're not at the completion state
      if (currentList?.list_id && !isCompleted) {
        saveSession(true, false);
      }
    };
  }, [currentList?.list_id, isCompleted]);

  if (isCompleted && !showResult) {
    // Calculate statistics for custom sessions
    const correct = score?.correct || 0;
    const wrong = score?.wrong || 0;
    const total = correct + wrong;
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    const grade = total > 0 ? ((correct / total) * 9 + 1).toFixed(1) : null;

    // Analyze wrong words
    interface WordStats {
      word: string;
      answer: string;
      wrongCount: number;
    }

    const wrongWordsMap = new Map<string, WordStats>();

    if (isCustomSession && Array.isArray(incorrectAnswerLog)) {
      incorrectAnswerLog.forEach((entry: any) => {
        const question = entry.word?.["1"] || "";
        const correctAnswer = entry.word?.["2"] || "";
        const key = `${question}|||${correctAnswer}`;
        const existing = wrongWordsMap.get(key);

        if (existing) {
          existing.wrongCount++;
        } else {
          wrongWordsMap.set(key, {
            word: question,
            answer: correctAnswer,
            wrongCount: 1,
          });
        }
      });
    }

    const wrongWords = Array.from(wrongWordsMap.values()).sort(
      (a, b) => b.wrongCount - a.wrongCount,
    );

    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="bg-neutral-800 rounded-lg p-8 text-white text-center">
          <>
            <h2 className="text-2xl font-bold mb-2">Einde van de lijst!</h2>
            {streakUpdate?.success && streakUpdate?.streakUpdated ? (
              <>
                {streakUpdate?.isNewStreak !== undefined && showCelebration ? (
                  <Celebration
                    streakCount={currentStreakCount}
                    showMessage={true}
                    loop={false}
                    isNewStreak={streakUpdate.isNewStreak}
                    onDismiss={() => setShowCelebration(false)}
                  />
                ) : null}
              </>
            ) : null}
            <p className="text-lg text-neutral-300">
              Je hebt alle woorden geoefend. Goed gedaan!
            </p>

            {/* Show stats calculation message for custom sessions */}
            {isCustomSession && isCalculatingStats && (
              <p className="text-sm text-sky-400 mt-2 animate-pulse">
                ⏳ Sluit dit scherm niet! Statistieken worden berekend...
              </p>
            )}

            <div className="pt-4 flex flex-row gap-4 justify-center">
              <Button1
                text="Opnieuw oefenen"
                onClick={() => {
                  window.location.reload();
                }}
              />
              <Button1
                text="Terug naar home"
                onClick={() => {
                  router.push("/home/start");
                }}
              />
              <Button1
                text="Naar statistieken"
                onClick={() => {
                  router.push(
                    `/learn/viewlist/${currentList?.list_id}/resultaten`,
                  );
                }}
              />
            </div>
          </>
        </div>

        {/* Statistics for custom sessions */}
        {isCustomSession && !isCalculatingStats && total > 0 && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {grade && (
                <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                  <div className="text-sm text-neutral-400 mb-1">Cijfer</div>
                  <div className="text-3xl font-bold">{grade}</div>
                </div>
              )}
              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <div className="text-sm text-neutral-400 mb-1">Score</div>
                <div className="text-3xl font-bold">
                  {percentage.toFixed(0)}%
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {correct} / {total}
                </div>
              </div>
              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <div className="text-sm text-neutral-400 mb-1">Goed</div>
                <div className="text-3xl font-bold text-green-500">
                  {correct}
                </div>
              </div>
              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <div className="text-sm text-neutral-400 mb-1">Fout</div>
                <div className="text-3xl font-bold text-red-500">{wrong}</div>
              </div>
            </div>

            {/* Wrong Words Analysis */}
            {wrongWords.length > 0 && (
              <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                  <span className="text-red-500">✕</span>
                  Fout beantwoorde woorden ({wrongWords.length})
                </h3>
                <div className="space-y-4">
                  {wrongWords.map((stat, idx) => (
                    <div
                      key={idx}
                      className="border-b border-neutral-700 pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-xs text-neutral-400 mb-1">
                            Vraag:
                          </div>
                          <div className="font-medium text-lg mb-2 text-white">
                            {stat.word}
                          </div>
                          <div className="text-xs text-neutral-400 mb-1">
                            Correct antwoord:
                          </div>
                          <div className="text-sm text-green-400 font-semibold">
                            {stat.answer}
                          </div>
                        </div>
                        <div className="ml-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                          {stat.wrongCount}× fout
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto relative overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={cardKey}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 35,
          }}
          className="bg-neutral-800 rounded-lg p-8 text-white relative"
        >
          <div className="space-y-6">
            {effectiveMode === "test" ? (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-4">
                    {currentWord?.["1"]}
                  </div>
                </div>
                <hr className="border-neutral-600" />
                <div className="space-y-4">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!showResult) {
                          handleSubmit();
                        } else {
                          handleNext();
                        }
                      }
                    }}
                    placeholder="Typ je antwoord..."
                    className="w-full bg-neutral-700 text-white h-13 rounded-lg text-center text-lg"
                  />

                  <div className="text-center">
                    {!showResult ? (
                      <>
                        <Button1 text="Controleer" onClick={handleSubmit} />
                        <br />
                        <button
                          type="button"
                          onClick={handleDontKnow}
                          className="mt-2 text-sm text-neutral-400 underline underline-offset-2 hover:text-neutral-200 transition-colors"
                        >
                          Geen idee
                        </button>
                      </>
                    ) : (
                      <Button1 text="Volgende" onClick={handleNext} />
                    )}
                  </div>
                </div>
              </>
            ) : effectiveMode === "hints" ? (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-4">
                    {currentWord?.["1"]}
                  </div>
                </div>
                <hr className="border-neutral-600" />
                <div className="space-y-4">
                  {/* Hint display */}
                  <div className="text-center">
                    <p className="text-sm text-neutral-400 mb-2">Hint:</p>
                    <p className="text-lg font-mono text-blue-300 bg-blue-900/20 px-3 py-2 rounded border border-blue-500/30">
                      {generateHint(currentWord?.["2"] || "")}
                    </p>
                  </div>

                  <Input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!showResult) {
                          handleSubmit();
                        } else {
                          handleNext();
                        }
                      }
                    }}
                    placeholder="Typ je antwoord..."
                    className="w-full bg-neutral-700 text-white h-13 rounded-lg text-center text-lg"
                  />

                  <div className="text-center">
                    {!showResult ? (
                      <>
                        <Button1 text="Controleer" onClick={handleSubmit} />
                        <br />
                        <button
                          type="button"
                          onClick={handleDontKnow}
                          className="mt-2 text-sm text-neutral-400 underline underline-offset-2 hover:text-neutral-200 transition-colors"
                        >
                          Geen idee
                        </button>
                      </>
                    ) : (
                      <Button1 text="Volgende" onClick={handleNext} />
                    )}
                  </div>
                </div>
              </>
            ) : effectiveMode === "multichoice" ? (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-4">
                    {currentWord?.["1"]}
                  </div>
                </div>
                <hr className="border-neutral-600" />
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    {mcOptions.map((option: string) => (
                      <Button1
                        key={option}
                        text={option}
                        onClick={() => handleMcClick(option)}
                        disabled={showResult}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : effectiveMode === "mind" ? (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-4">
                    {currentWord?.["1"]}
                  </div>
                </div>
                <hr className="border-neutral-600 mb-4" />
                <div className="text-center">
                  <Button1 text="Controleer" onClick={handleMindCheck} />
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold mb-4">
                  {currentWord?.["1"]}
                </div>
                <hr className="border-neutral-600 mb-4" />
                <div className="text-lg text-neutral-300 mb-4">
                  {currentWord?.["2"]}
                </div>
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 font-medium">
                    {currentMethod === "learnlist" && queueFirst
                      ? `LearnList — ${queueFirst.mode === "mc" ? "multichoice" : queueFirst.mode}`
                      : `Mode: ${effectiveMode}`}
                  </p>
                  {["test", "hints", "multichoice", "mind"].includes(
                    effectiveMode || "",
                  ) ? (
                    <p className="text-sm text-neutral-400 mt-2">
                      Gebruik de {effectiveMode} interface om te oefenen.
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-400 mt-2">
                      Deze modus wordt binnenkort geïmplementeerd
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Overlay screens - show for test, hints, and multichoice modes */}
          {(effectiveMode === "test" ||
            effectiveMode === "hints" ||
            effectiveMode === "multichoice") && (
            <>
              <CorrectScreen
                show={showResult && isCorrect}
                progress={progress}
                showProgress={isTimerActive}
              />
              <IncorrectScreen
                show={showResult && !isCorrect && !showTypfout}
                correctAnswer={currentWord?.["2"] || ""}
                progress={progress}
                showProgress={isTimerActive}
                setIsCorrect={handleTypfoutMark}
              />
              <TypfoutScreen
                show={showTypfout}
                userInput={userInput}
                correctAnswer={currentWord?.["2"] || ""}
                onMark={handleTypfoutMark}
                progress={progress}
                showProgress={false}
              />
            </>
          )}
          {effectiveMode === "mind" && (
            <BlueReview
              show={showBlueReview}
              answer={currentWord?.["2"] || ""}
              onMark={handleMindMark}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
