"use client";

import { useState, useEffect } from "react";
import { getWordPairs, saveTestResults, saveProgress } from "@/app/learn/mind/actions.ts";

type WordPair = {
  question: string;
  answer: string;
};

export default function LearnTool({ listId, onExit }: { listId: string; onExit: () => void }) {
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ question: string; answer: string; correct: boolean }[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [userProgress, setUserProgress] = useState(0); // Voortgang
  const [saveProgressLoading, setSaveProgressLoading] = useState(false); // Voor het laden tijdens opslaan van voortgang

  useEffect(() => {
    async function loadWords() {
      const words = await getWordPairs(listId);
      setWordPairs(shuffleArray(words));
      setLoading(false);
      setStartTime(Date.now()); // Start tijd bijhouden
    }
    loadWords();
  }, [listId]);

  const shuffleArray = (array: WordPair[]): WordPair[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const handleAnswer = async (isCorrect: boolean) => {
    setAnswers((prev) => [
      ...prev,
      { question: wordPairs[index].question, answer: wordPairs[index].answer, correct: isCorrect }
    ]);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectCount((prev) => prev + 1);
    }

    if (index + 1 < wordPairs.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
      if (startTime) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        await saveTestResults(correctCount, incorrectCount, duration, answers, listId);
      }
    }
  };

  // Functie om voortgang op te slaan
  const handleSaveProgress = async () => {
    setSaveProgressLoading(true);
    const progress = ((index + 1) / wordPairs.length) * 100;
    setUserProgress(progress);
    await saveProgress(listId, progress); // Save progress
    setSaveProgressLoading(false);
  };

  if (loading) return <p>Laden...</p>;

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-lg mx-auto">
      {!finished ? (
        <>
          {/* Voortgangsbalk */}
          <div className="w-full bg-gray-200 h-3 rounded-full mb-4">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${((index + 1) / wordPairs.length) * 100}%` }}
            />
          </div>
          {/* Vraag */}
          <h2 className="text-2xl font-bold mb-4">{wordPairs[index]?.question}</h2>
          {/* Knoppen voor zelfevaluatie */}
          <div className="flex w-full justify-between mt-4">
            <button
              className="p-2 bg-red-500 text-white rounded"
              onClick={() => handleAnswer(false)}
            >
              Nee
            </button>
            <button
              className="p-2 bg-green-500 text-white rounded"
              onClick={() => handleAnswer(true)}
            >
              Ja
            </button>
          </div>
          {/* Counters met iconen */}
          <div className="flex space-x-4 mt-4">
            <div className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full mr-1">
                ✔
              </span>
              <span>{correctCount}</span>
            </div>
            <div className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full mr-1">
                ✖
              </span>
              <span>{incorrectCount}</span>
            </div>
          </div>
          {/* Terug-knop */}
          <div className="mt-4">
            <button className="p-2 bg-gray-500 text-white rounded" onClick={onExit}>
              Terug
            </button>
          </div>
          {/* Opslaan van voortgang */}
          <div className="mt-4">
            <button
              className={`p-2 ${saveProgressLoading ? "bg-gray-400" : "bg-blue-500"} text-white rounded`}
              onClick={handleSaveProgress}
              disabled={saveProgressLoading}
            >
              {saveProgressLoading ? "Voortgang opslaan..." : "Voortgang opslaan"}
            </button>
          </div>
        </>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Klaar!</h2>
          <p>Tijd: {Math.floor((Date.now() - startTime!) / 1000)} seconden</p>
          <div className="flex space-x-4 mt-4">
            <div className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full mr-1">
                ✔
              </span>
              <span>{correctCount}</span>
            </div>
            <div className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full mr-1">
                ✖
              </span>
              <span>{incorrectCount}</span>
            </div>
          </div>
          <div className="mt-4">
            <button className="p-2 bg-gray-500 text-white rounded" onClick={onExit}>
              Terug
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
