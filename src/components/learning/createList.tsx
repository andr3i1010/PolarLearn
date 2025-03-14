"use client";
import React, { useState, useRef, useEffect } from "react";
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
import Dropdown, { DropdownHandle } from "@/components/button/DropdownBtn";
import Image from "next/image";
import { ReactNode } from "react";
import { createListAction } from "@/serverActions/createList";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation"; // Add router import

// Subject images //
import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/english.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';
import gs_img from '@/app/img/history.svg';
import bi_img from '@/app/img/bio.svg';

// Define the pair type.
type Pair = {
  id: number;
  "1": string;
  "2": string;
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

export default function CreateListTool() {
  const router = useRouter(); // Initialize router
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);
  const [listName, setListName] = useState("");
  const dropdownRef = useRef<DropdownHandle>(null);
  const naarDropdownRef = useRef<DropdownHandle>(null);
  const vanDropdownRef = useRef<DropdownHandle>(null); // NEW ref for first language dropdown

  const [pairs, setPairs] = useState<Pair[]>([{ id: 0, "1": '', "2": '' }]);
  const [nextId, setNextId] = useState(1);
  const [selectedPairId, setSelectedPairId] = useState<number | null>(null);
  const [selectedInput, setSelectedInput] = useState<string | null>(null);
  const [translations, setTranslations] = useState<{ [id: number]: string }>({});
  const [selectedTaal, setSelectedTaal] = useState<string | undefined>(undefined);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; display: ReactNode } | undefined>(undefined);

  const languageIds = ["NL", "FR", "EN", "DE"];
  const subjectIsLanguage = selectedSubject ? languageIds.includes(selectedSubject.id) : false;

  useEffect(() => {
    const defaultDutchDisplay = (
      <div className="flex items-center gap-2">
        <Image src={nl_img} alt="Nederlands" width={20} height={20} />
        <p>Nederlands</p>
      </div>
    );
    if (vanDropdownRef.current) {
      vanDropdownRef.current.setValue("NL", defaultDutchDisplay);
    }
    if (naarDropdownRef.current) {
      if (selectedSubject && ["FR","EN","DE","NL"].includes(selectedSubject.id)) {
        // Lock "naar" dropdown to the chosen subject language.
        naarDropdownRef.current.setValue(selectedSubject.id, selectedSubject.display);
      } else {
        naarDropdownRef.current.setValue("NL", defaultDutchDisplay);
      }
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubject) {
      setSelectedTaal(selectedSubject.id);
    }
  }, [selectedSubject]);

  useEffect(() => {
    // On load, default both language dropdowns to Dutch.
    const defaultDutchDisplay = (
      <div className="flex items-center gap-2">
        <Image src={nl_img} alt="Nederlands" width={20} height={20} />
        <p>Nederlands</p>
      </div>
    );
    if (vanDropdownRef.current) {
      vanDropdownRef.current.setValue("NL", defaultDutchDisplay);
    }
    if (naarDropdownRef.current) {
      naarDropdownRef.current.setValue("NL", defaultDutchDisplay);
    }
  }, []);

  const addPair = () => {
    setPairs([...pairs, { id: nextId, "1": '', "2": '' }]);
    setNextId(nextId + 1);
    console.log(pairs)
  };

  const removePair = (id: number) => {
    setPairs(pairs.filter((pair) => pair.id !== id));
  };

  const handleWordChange = (id: number, value: string) => {
    setPairs((prev) =>
      prev.map((pair) =>
        pair.id === id ? { ...pair, "1": value } : pair
      )
    );
  };

  const handleSecondInputChange = (id: number, value: string) => {
    setPairs((prev) =>
      prev.map((pair) =>
        pair.id === id ? { ...pair, "2": value } : pair
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

  // Add constant to check if the selected subject is a language
  const isLanguage = selectedLanguage && ["FR", "EN", "DE"].includes(selectedLanguage);

  // NEW: Function to save the list (published: false)
  async function saveList() {
    // Check for list name
    if (!listName.trim()) {
      toast.error("Voer een naam in voor de lijst.");
      return;
    }
    // Check for subject selection.
    if (!selectedSubject) {
      toast.error("Selecteer alstublieft een vak.");
      return;
    }
    // Check that at least one pair field "1" is filled.
    const hasFilledPair = pairs.some(pair => pair["1"].trim() !== "");
    if (!hasFilledPair) {
      toast.error("Vul ten minste één paar in.");
      return;
    }

    const listData = {
      name: listName,
      mode: "list",
      data: pairs,
      lang_from: vanDropdownRef.current?.getSelectedItem(),
      lang_to: naarDropdownRef.current?.getSelectedItem(),
      subject: selectedSubject.id, // Include the subject
    };
    try {
      const data = await createListAction(listData);
      console.log("List saved", data);
      toast.success("Lijst succesvol opgeslagen.");
      if (data && data.id) {
        router.push(`/learn/viewlist/${data.id}`);
      }
    } catch (error) {
      console.error("Error saving list", error);
      toast.error("Er trad een fout op bij het opslaan.");
    }
  }

  async function publishList() {
    // Check for list name
    if (!listName.trim()) {
      toast.error("Voer een naam in voor de lijst.");
      return;
    }
    if (!selectedSubject) {
      toast.error("Selecteer alstublieft een vak.");
      return;
    }
    const hasFilledPair = pairs.some(pair => pair["1"].trim() !== "");
    if (!hasFilledPair) {
      toast.error("Vul ten minste één paar in.");
      return;
    }
    const listData = {
      name: listName,
      mode: "list",
      data: pairs,
      lang_from: vanDropdownRef.current?.getSelectedItem(),
      lang_to: naarDropdownRef.current?.getSelectedItem(),
      subject: selectedSubject.id, // Include the subject
    };
    try {
      const data = await createListAction(listData);
      console.log("List published", data);
      toast.success("Lijst succesvol geüpload.");
      if (data && data.id) {
        router.push(`/learn/viewlist/${data.list_id}`);
      }
    } catch (error) {
      console.error("Error publishing list", error instanceof Error ? error.stack : error);
      toast.error("Er trad een fout op bij het uploaden.");
    }
  }

  async function logRawData() {
    const listData = {
      name: listName,
      mode: "list",
      data: pairs,
      lang_from: vanDropdownRef.current?.getSelectedItem(),
      lang_to: naarDropdownRef.current?.getSelectedItem(),
      subject: selectedSubject?.id, // Include the subject
    };
    console.log("Raw list data:", listData);
  }

  return (
    <>
      <div className="mx-2">
        {/* Added Back Button */}
        <a
          href="https://polarlearn.tech/home/start"
          className="fixed top-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>

        <div className="h-3" />
        <form className="relative z-50">
          <div className="flex flex-row gap-4">
            <Dropdown
              ref={dropdownRef}
              text="Kies een vak"
              width={200}
              dropdownMatrix={[
                [
                  <div className="flex items-center gap-2">
                    <Image src={nl_img} alt="nederlands plaatje" width={20} height={20} />
                    <p>Nederlands</p>
                  </div>,
                  "NL"
                ],
                [
                  <div className="flex items-center gap-2">
                    <Image src={math_img} alt="wiskunde plaatje" width={20} height={20} />
                    <p>Wiskunde</p>
                  </div>, "WI"
                ],
                [
                  <div className="flex items-center gap-2">
                    <Image src={nsk_img} alt="nask plaatje" width={20} height={20} />
                    <p>NaSk</p>
                  </div>, "NSK"
                ],
                [
                  <div className="flex items-center gap-2">
                    <Image src={ak_img} alt="aardrijkskunde plaatje" width={20} height={20} />
                    <p>Aardrijkskunde</p>
                  </div>, "AK"
                ],
                [
                  <div className="flex items-center gap-2">
                    <Image src={fr_img} alt="frans plaatje" width={20} height={20} />
                    <p>Frans</p>
                  </div>, "FR"
                ],
                [
                  <div className="flex items-center gap-2">
                    <Image src={eng_img} alt="engels plaatje" width={20} height={20} />
                    <p>Engels</p>
                  </div>, "EN"
                ],
                [
                  <div className="flex items-center gap-2">
                    <Image src={de_img} alt="duits plaatje" width={20} height={20} />
                    <p>Duits</p>
                  </div>, "DE"
                ],
                [
                  <div className="flex items-center gap-2">
                    <Image src={gs_img} alt="geschiedenis plaatje" width={20} height={20} />
                    <p>Geschiedenis</p>
                  </div>, "GS"
                ],
                [
                  <div className="flex items-center gap-2">
                    <Image src={bi_img} alt="biologie plaatje" width={20} height={20} />
                    <p>Biologie</p>
                  </div>, "BI"
                ]
              ]}
              selectorMode={true}
              onChangeSelected={(selected) => {
                setSelectedSubject(selected);
                setSelectedLanguage(selected.id);
              }}
            />
          </div>
          <input
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="mt-16 bg-neutral-800 text-white h-12 w-full rounded-lg text-center text-xl"
            type="text"
            placeholder="Lijstnaam komt hier"
          />
          <div className="mt-4 flex justify-center gap-4">
            <div className="w-1/2 z-0 ml-52">
              <Dropdown
                ref={vanDropdownRef}
                text="Van.."
                width={200}
                dropdownMatrix={[
                  [
                    <div className="flex items-center gap-2">
                      <Image src={nl_img} alt="Nederlands" width={20} height={20} />
                      <p>Nederlands</p>
                    </div>,
                    "NL"
                  ],
                  [
                    <div className="flex items-center gap-2">
                      <Image src={fr_img} alt="Frans" width={20} height={20} />
                      <p>Frans</p>
                    </div>,
                    "FR"
                  ],
                  [
                    <div className="flex items-center gap-2">
                      <Image src={eng_img} alt="Engels" width={20} height={20} />
                      <p>Engels</p>
                    </div>,
                    "EN"
                  ],
                  [
                    <div className="flex items-center gap-2">
                      <Image src={de_img} alt="Duits" width={20} height={20} />
                      <p>Duits</p>
                    </div>,
                    "DE"
                  ]
                ]}
                selectorMode={true}
                onChange={(selected) => setSelectedTaal(selected)}
              />
            </div>
            <div className="w-1/2 pl-28">
              <Dropdown
                ref={naarDropdownRef}
                text="Naar.."
                width={200}
                dropdownMatrix={[
                  [
                    <div className="flex items-center gap-2">
                      <Image src={nl_img} alt="Nederlands" width={20} height={20} />
                      <p>Nederlands</p>
                    </div>,
                    "NL"
                  ],
                  [
                    <div className="flex items-center gap-2">
                      <Image src={fr_img} alt="Frans" width={20} height={20} />
                      <p>Frans</p>
                    </div>,
                    "FR"
                  ],
                  [
                    <div className="flex items-center gap-2">
                      <Image src={eng_img} alt="Engels" width={20} height={20} />
                      <p>Engels</p>
                    </div>,
                    "EN"
                  ],
                  [
                    <div className="flex items-center gap-2">
                      <Image src={de_img} alt="Duits" width={20} height={20} />
                      <p>Duits</p>
                    </div>,
                    "DE"
                  ]
                ]}
                selectorMode={true}
                disabled={selectedSubject && ["FR","EN","DE","NL"].includes(selectedSubject.id)}
              />
            </div>
          </div>
        </form>
        <div className="h-16" />
      </div>
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
                            value={pair["1"]}
                            onChange={(e) => handleWordChange(pair.id, e.target.value)}
                            onFocus={() => { setSelectedPairId(pair.id); setSelectedInput('word'); }}
                            onBlur={() => { if (selectedInput !== 'translationButton') { setSelectedPairId(null); setSelectedInput(null); } }}
                            className="bg-neutral-700 text-white h-12 flex-grow rounded-lg text-center pr-4 text-xl"
                            type="text"
                            placeholder={isLanguage ? "Woord in het Nederlands" : "Begrip"}
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
                            value={pair["2"]}
                            onChange={(e) => handleSecondInputChange(pair.id, e.target.value)}
                            onFocus={() => {
                              setSelectedPairId(pair.id);
                              setSelectedInput('secondInput');
                              const trimmedWord = pair["1"].trim();
                              if (trimmedWord.length > 0) {
                                getTranslation(pair["1"], selectedLanguage).then(translatedText => {
                                  setTranslations(prev => ({ ...prev, [pair.id]: translatedText }));
                                });
                              }
                            }}
                            className="bg-neutral-700 text-white h-12 flex-grow rounded-lg text-center pl-4 text-xl"
                            type="text"
                            placeholder={isLanguage ? "Vertaling" : "Uitleg van het begrip"}
                          />
                        </div>
                        {translations[pair.id] && selectedPairId === pair.id && selectedInput === 'secondInput' && (
                          <div className="mt-2 border-t border-neutral-600 pt-2 flex justify-end">
                            <Button1
                              text={translations[pair.id]}
                              onClick={() => {
                                setPairs(p => p.map(innerPair =>
                                  innerPair.id === pair.id ? { ...innerPair, "2": translations[pair.id] } : innerPair
                                ));
                                setTranslations(prev => {
                                  const { [pair.id]: removed, ...rest } = prev;
                                  return rest;
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </SortableItem>
                </motion.div>
              ))}
            </AnimatePresence>
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
      <div className="mt-4 flex justify-center space-x-4">
        <Button1
          text="Lijst uploaden"
          onClick={publishList}
        />
        <Button1
          text="Lijst opslaan"
          onClick={saveList}
        />
        {/* NEW: Button to log raw list data */}
        <Button1
          text="Log Raw Data"
          onClick={logRawData}
        />
      </div>
      <div className="h-8" />
    </>);
}
