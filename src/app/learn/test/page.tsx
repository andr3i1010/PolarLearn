'use client';

import { useState, useEffect } from "react";
import { getWordPairs, saveTestResults } from "@/app/api/actions";

type WordPair = {
  question: string;
  answer: string;
};

export default function TestMode({ listId, onExit }: { listId: string; onExit: () => void }) {
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]); // Type toevoegen
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWords() {
      const words = await getWordPairs(listId);
      setWordPairs(shuffleArray(words));
      setLoading(false);
    }
    loadWords();
  }, [listId]);

  const shuffleArray = (array: WordPair[]) => [...array].sort(() => Math.random() - 0.5); // Type toevoegen

  const handleSubmit = async () => {
    if (index >= wordPairs.length) return;

    const isCorrect = input.trim().toLowerCase() === wordPairs[index].answer.toLowerCase();

    if (isCorrect) setCorrectCount((prev) => prev + 1);
    else setIncorrectCount((prev) => prev + 1);

    setInput("");

    if (index + 1 < wordPairs.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
      await saveTestResults(correctCount + (isCorrect ? 1 : 0), incorrectCount + (isCorrect ? 0 : 1), listId);
    }
  };

  if (loading) return <p>Laden....</p>;

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-lg mx-auto">
      {!finished ? (
        <>
          <div className="w-full bg-gray-200 h-3 rounded-full mb-4">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${((index + 1) / wordPairs.length) * 100}%` }}
            />
          </div>
          <h2 className="text-2xl font-bold mb-4">Vul In: {wordPairs[index]?.question}</h2>
          <input
            className="border p-2 rounded w-full"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          <div className="flex w-full justify-between mt-4">
            <button className="p-2 bg-red-500 text-white rounded" onClick={onExit}>
              Terug
            </button>
            <button className="p-2 bg-blue-500 text-white rounded" onClick={handleSubmit}>
              Verder
            </button>
          </div>
          <p className="mt-4">Correct: {correctCount} | Incorrect: {incorrectCount}</p>
        </>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Toets Klaar!</h2>
          <p>Correct answers: {correctCount}</p>
          <p>Incorrect answers: {incorrectCount}</p>
          <button className="mt-4 p-2 bg-gray-500 text-white rounded" onClick={onExit}>
            Exit
          </button>
        </div>
      )}
    </div>
  );
}
