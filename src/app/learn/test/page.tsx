"use client";

import { useState, useEffect } from "react";
import { getWordPairs, saveTestResults } from "@/actions"; 

export default function TestMode({ listId }: { listId: string }) {  // listId is nu een string
  const [wordPairs, setWordPairs] = useState([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWords() {
      const words = await getWordPairs(listId);  // listId wordt als string doorgegeven
      setWordPairs(shuffleArray(words));  // Schudden van de lijst voor willekeurige volgorde
      setLoading(false);
    }
    loadWords();
  }, [listId]);

  // Functie voor het schudden van de lijst
  const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

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
      await saveTestResults(correctCount, incorrectCount, Number(listId));  // Zorg ervoor dat de listId als number wordt doorgegeven
    }
  };

  if (loading) return <p>Loading word pairs...</p>;

  return (
    <div className="flex flex-col items-center p-4">
      {!finished ? (
        <>
          <h2 className="text-2xl font-bold mb-4">Translate: {wordPairs[index]?.question}</h2>
          <input
            className="border p-2 rounded"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          <button className="mt-2 p-2 bg-blue-500 text-white rounded" onClick={handleSubmit}>
            Submit
          </button>
          <p className="mt-4">Correct: {correctCount} | Incorrect: {incorrectCount}</p>
        </>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Test Completed!</h2>
          <p>Correct answers: {correctCount}</p>
          <p>Incorrect answers: {incorrectCount}</p>
        </div>
      )}
    </div>
  );
}
