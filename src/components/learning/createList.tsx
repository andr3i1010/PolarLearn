"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Button1 from "@/components/button/Button1";

// Define the pair type.
type Pair = {
  id: number;
  word: string;
  secondInput: string;
  translation: string;
};

// SortableItem component for each draggable pair.
function SortableItem({
  id,
  children,
}: {
  id: number;
  children: (props: { dragListeners: any }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ dragListeners: listeners })}
    </div>
  );
}

interface CreateListToolProps {
  language?: string;
}

export default function CreateListTool({ language }: CreateListToolProps) {
  // State: Each pair is represented by a unique id.
  const [pairs, setPairs] = useState<Pair[]>([{ id: 0, word: '', secondInput: '', translation: '' }]);
  // Separate counter for unique ids.
  const [nextId, setNextId] = useState(1);
  // State to track the selected pair id and input field.
  const [selectedPairId, setSelectedPairId] = useState<number | null>(null);
  const [selectedInput, setSelectedInput] = useState<string | null>(null);

  const addPair = () => {
    setPairs([...pairs, { id: nextId, word: '', secondInput: '', translation: '' }]);
    setNextId(nextId + 1);
  };

  const removePair = (id: number) => {
    setPairs(pairs.filter((pair) => pair.id !== id));
  };

  // Handle translation filling
  const handleTranslationClick = (id: number) => {
    setPairs((prev) =>
      prev.map((pair) =>
        pair.id === id ? { ...pair, secondInput: pair.translation } : pair
      )
    );
    setSelectedPairId(null);
    setSelectedInput(null);
  };

  const handleWordChange = (id: number, value: string) => {
    setPairs((prev) =>
      prev.map((pair) =>
        pair.id === id ? { ...pair, word: value } : pair
      )
    );
  };

  const handleSecondInputChange = (id: number, value: string) => {
    setPairs((prev) =>
      prev.map((pair) =>
        pair.id === id ? { ...pair, secondInput: value } : pair
      )
    );
  };

  // New async function to handle the translation
  const getTranslation = async (word: string, language: string | undefined): Promise<string> => {
    if (language && word && ["DE", "FR", "EN"].includes(language)) {
      try {
        const res = await fetch(`/api/translate?text=${encodeURIComponent(word)}&to=${language}`);
        const data = await res.json();
        return data.translation || '';
      } catch (error) {
        console.error("Translation error", error);
        return '';
      }
    }
    return '';
  };

  // Configure sensors for dndkit.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Handle drag end using arrayMove from dndkit.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pairs.findIndex((pair) => pair.id === active.id);
      const newIndex = pairs.findIndex((pair) => pair.id === over.id);
      setPairs(arrayMove(pairs, oldIndex, newIndex));
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pairs.map((pair) => pair.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            <AnimatePresence>
              {pairs.map((pair, index) => (
                <motion.div
                  key={pair.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <SortableItem id={pair.id}>
                    {({ dragListeners }) => (
                      <div
                        className="relative flex flex-col bg-neutral-800 shadow-lg rounded-lg transition-all p-4"
                      >
                        <div className="flex flex-row items-center gap-2">
                          <span className="text-white mr-2 text-xl">{index + 1}</span>
                          <input
                            value={pair.word}
                            onChange={(e) => handleWordChange(pair.id, e.target.value)}
                            onFocus={() => { setSelectedPairId(pair.id); setSelectedInput('word'); }}
                            onBlur={() => { if (selectedInput !== 'translationButton') { setSelectedPairId(null); setSelectedInput(null); } }}
                            className="bg-neutral-700 text-white h-12 flex-grow rounded-lg text-center pr-4 text-xl"
                            type="text"
                            placeholder="Begrip"
                          />
                          <div className="flex flex-row items-center gap-2">
                            <div
                              className="cursor-grab"
                              {...dragListeners}
                              onMouseDown={(e) => (e.currentTarget.style.cursor = "grabbing")}
                              onMouseUp={(e) => (e.currentTarget.style.cursor = "grab")}
                              onMouseLeave={(e) => (e.currentTarget.style.cursor = "grab")}
                            >
                              <svg
                                width="24"
                                height="24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="flex-shrink-0"
                              >
                                <circle cx="5" cy="5" r="2" fill="white" />
                                <circle cx="5" cy="12" r="2" fill="white" />
                                <circle cx="5" cy="19" r="2" fill="white" />
                                <circle cx="12" cy="5" r="2" fill="white" />
                                <circle cx="12" cy="12" r="2" fill="white" />
                                <circle cx="12" cy="19" r="2" fill="white" />
                              </svg>
                            </div>
                            <button
                              onClick={() => removePair(pair.id)}
                              className="ml-2 flex-none"
                            >
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M10 11v6M14 11v6"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                          <input
                            value={pair.secondInput}
                            onChange={(e) => handleSecondInputChange(pair.id, e.target.value)}
                            onFocus={() => {
                              setSelectedPairId(pair.id);
                              setSelectedInput('secondInput');
                              const trimmedWord = pair.word.trim();
                              if (trimmedWord.length > 0) {
                                getTranslation(pair.word, language).then(translation => {
                                  setPairs(p => p.map(innerPair =>
                                    innerPair.id === pair.id ? { ...innerPair, translation } : innerPair
                                  ));
                                });
                              }
                            }}
                            className="bg-neutral-700 text-white h-12 flex-grow rounded-lg text-center pl-4 text-xl"
                            type="text"
                            placeholder="Vertaling of uitleg"
                          />
                        </div>
                        {pair.translation && selectedPairId === pair.id && selectedInput === 'secondInput' && (
                          <div className="mt-2 border-t border-neutral-600 pt-2 flex justify-end">
                            <Button1
                              text={pair.translation}
                              onClick={() => { handleTranslationClick(pair.id); }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </SortableItem>
                </motion.div>
              ))}
            </AnimatePresence>
            {/* Add new pair button remains outside sortable context */}
            <div className="relative flex items-center rounded-lg bg-neutral-800 shadow-lg p-4 h-20 transition-all hover:bg-neutral-700">
              <button
                onClick={addPair}
                className="absolute inset-0 flex items-center justify-center gap-2 text-xl"
              >
                <svg
                  width="40px"
                  height="40px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path
                      d="M6 12H18M12 6V18"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </g>
                </svg>
                <span>Nieuw paar</span>
              </button>
            </div>
            <div className="h-1" />
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
