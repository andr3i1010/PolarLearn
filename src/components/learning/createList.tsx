"use client";
// Beste developer,
// Ik heb mijn tijd enorm verspilt aan alle animaties maken.
// Het zou fijn zijn als jij de animatie zou maken voor als de gebruiker een paar loslaat,
// dus dat het mooi beweegt naar zijn plek.
// ik heb dit al gebrobeerd te doen, maar dat is verschrikkelijk mislukt.
// const wastedHours = 4
// Met vriendelijke groeten, andrei1010
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
import Link from "next/link";
import { icons, subjectEmojiMap, getSubjectIcon, getSubjectName } from "@/components/icons"; // Import icons from a centralized location

type Pair = {
  id: number;
  "1": string;
  "2": string;
};

// Add interface for the list data
interface ListToEdit {
  list_id: string;
  name: string;
  subject: string;
  data: Pair[];
  lang_from: string;
  lang_to: string;
  mode: string;
}

// SortableItem component for each draggable pair.
function SortableItem({
  id,
  children,
}: {
  id: number;
  children: (props: { dragListeners: any }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 1000 : 300, // lowered z-index when dragging
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ dragListeners: listeners })}
    </div>
  );
}

export default function CreateListTool({ listToEdit }: { listToEdit?: ListToEdit }) {
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
  const [isDragging, setIsDragging] = useState(false); // NEW state for dragging
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autosavedListId, setAutosavedListId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const debouncedSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isEditMode = !!listToEdit;


  useEffect(() => {
    const defaultDutchDisplay = (
      <div className="flex items-center gap-2">
        <Image src={icons.nl_img} alt="Nederlands" width={20} height={20} />
        <p>Nederlands</p>
      </div>
    );
    if (vanDropdownRef.current) {
      vanDropdownRef.current.setValue("NL", defaultDutchDisplay);
    }
    if (naarDropdownRef.current) {
      if (selectedSubject && ["FR", "EN", "DE", "NL"].includes(selectedSubject.id)) {
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
        <Image src={icons.NL} alt="Nederlands" width={20} height={20} />
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

  // NEW: Update global cursor based on dragging state.
  useEffect(() => {
    document.body.style.cursor = isDragging ? "grabbing" : "default";
    return () => { document.body.style.cursor = "default"; };
  }, [isDragging]);

  // Populate form with existing data if editing
  useEffect(() => {
    if (listToEdit) {
      // Set list name
      setListName(listToEdit.name);

      // Set subject
      if (listToEdit.subject) {
        const subjectIcon = getSubjectIcon(listToEdit.subject);
        if (subjectIcon) {
          const subjectDisplay = (
            <div className="flex items-center gap-2">
              <Image src={subjectIcon} alt={`${listToEdit.subject} icon`} width={20} height={20} />
              <p>{getSubjectName(listToEdit.subject)}</p>
            </div>
          );

          setSelectedSubject({ id: listToEdit.subject, display: subjectDisplay });
          setSelectedLanguage(listToEdit.subject);

          if (dropdownRef.current) {
            dropdownRef.current.setValue(listToEdit.subject, subjectDisplay);
          }
        }
      }

      // Set data pairs
      if (Array.isArray(listToEdit.data) && listToEdit.data.length > 0) {
        const formattedPairs = listToEdit.data.map((item, index) => ({
          id: index,
          "1": item["1"] || "",
          "2": item["2"] || ""
        }));

        setPairs(formattedPairs);
        setNextId(formattedPairs.length);
      }

      // Set language selections
      if (listToEdit.lang_from && vanDropdownRef.current) {
        const langFrom = listToEdit.lang_from;
        const fromIcon = getSubjectIcon(langFrom);
        if (fromIcon) {
          const display = (
            <div className="flex items-center gap-2">
              <Image src={fromIcon} alt={getSubjectName(langFrom)} width={20} height={20} />
              <p>{getSubjectName(langFrom)}</p>
            </div>
          );
          vanDropdownRef.current.setValue(langFrom, display);
        }
      }

      if (listToEdit.lang_to && naarDropdownRef.current) {
        const langTo = listToEdit.lang_to;
        const toIcon = getSubjectIcon(langTo);
        if (toIcon) {
          const display = (
            <div className="flex items-center gap-2">
              <Image src={toIcon} alt={getSubjectName(langTo)} width={20} height={20} />
              <p>{getSubjectName(langTo)}</p>
            </div>
          );
          naarDropdownRef.current.setValue(langTo, display);
        }
      }
    }
  }, [listToEdit]);

  const addPair = () => {
    setPairs([...pairs, { id: nextId, "1": '', "2": '' }]);
    setNextId(nextId + 1);
    markHasChanges();
  };

  const removePair = (id: number) => {
    setPairs(pairs.filter((pair) => pair.id !== id));
    markHasChanges();
  };

  const markHasChanges = () => {
    setHasChanges(true);
  };

  const handleWordChange = (id: number, value: string) => {
    setPairs((prev) =>
      prev.map((pair) =>
        pair.id === id ? { ...pair, "1": value } : pair
      )
    );
    markHasChanges();
  };

  const handleSecondInputChange = (id: number, value: string) => {
    setPairs((prev) =>
      prev.map((pair) =>
        pair.id === id ? { ...pair, "2": value } : pair
      )
    );
    markHasChanges();
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
    setIsDragging(false); // NEW: Reset dragging state
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pairs.findIndex((pair) => pair.id === active.id);
      const newIndex = pairs.findIndex((pair) => pair.id === over.id);
      setPairs(arrayMove(pairs, oldIndex, newIndex));
      markHasChanges();
    }
  };

  // Add constant to check if the selected subject is a language
  const isLanguage = selectedLanguage && ["FR", "EN", "DE"].includes(selectedLanguage);

  // Function to autosave the list - simplified for reliability
  const autosaveList = async () => {
    // Only check for subject, always save if we have one
    if (!selectedSubject) {
      return;
    }

    setIsSaving(true);

    try {
      // Make sure we have minimal required data
      const listData = {
        listId: listToEdit?.list_id ?? autosavedListId ?? undefined,
        name: listName || "Naamloze Lijst",
        mode: "list",
        data: pairs.length > 0 ? pairs : [{ id: 0, "1": "", "2": "" }],
        lang_from: vanDropdownRef.current?.getSelectedItem() || "NL",
        lang_to: naarDropdownRef.current?.getSelectedItem() || "NL",
        subject: selectedSubject.id,
        autosave: true,
        published: false
      };

      const data = await createListAction(listData);

      if (data && typeof data === 'object' && 'list_id' in data) {
        setAutosavedListId(data.list_id);
        setLastSaved(new Date());
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Autosave failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Simpler and more reliable debounced autosave function
  useEffect(() => {
    // Always save when subject is selected and any changes are made
    if (selectedSubject) {
      // Clear existing timeout
      if (debouncedSaveTimeoutRef.current) {
        clearTimeout(debouncedSaveTimeoutRef.current);
      }

      // Set new timeout to save after just 800ms
      debouncedSaveTimeoutRef.current = setTimeout(() => {
        autosaveList();
      }, 800);
    }

    // Cleanup
    return () => {
      if (debouncedSaveTimeoutRef.current) {
        clearTimeout(debouncedSaveTimeoutRef.current);
      }
    };
  }, [listName, selectedSubject, pairs]); // Depend directly on changed data

  // Track changes to list name
  useEffect(() => {
    if (listToEdit?.name !== listName && listName !== "") {
      markHasChanges();
    }
  }, [listName]);

  // Track changes to subject
  useEffect(() => {
    if (listToEdit?.subject !== selectedSubject?.id && selectedSubject) {
      markHasChanges();
    }
  }, [selectedSubject]);

  // Update the save and publish functions to handle both create and update
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
      listId: listToEdit?.list_id ?? autosavedListId ?? undefined,
      name: listName || "Naamloze Lijst",
      mode: "list",
      data: pairs,
      lang_from: vanDropdownRef.current?.getSelectedItem(),
      lang_to: naarDropdownRef.current?.getSelectedItem(),
      subject: selectedSubject.id,
      published: false, // Explicitly save as unpublished
    };

    try {
      const data = await createListAction(listData);
      const message = isEditMode ? "Lijst succesvol bijgewerkt." : "Lijst succesvol opgeslagen.";
      toast.success(message);
      setHasChanges(false);
      setLastSaved(new Date());

      if (data && typeof data === 'object' && 'list_id' in data) {
        setAutosavedListId(data.list_id);
        router.push(`/learn/viewlist/${data.list_id}`);
      }
    } catch (error) {
      console.error(isEditMode ? "Error updating list" : "Error saving list", error);
      toast.error(`Er trad een fout op bij het ${isEditMode ? 'bijwerken' : 'opslaan'}.`);
    }
  }

  async function publishList() {
    // Same validation as saveList
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
      listId: listToEdit?.list_id ?? autosavedListId ?? undefined,
      name: listName || "Naamloze Lijst",
      mode: "list",
      data: pairs,
      lang_from: vanDropdownRef.current?.getSelectedItem(),
      lang_to: naarDropdownRef.current?.getSelectedItem(),
      subject: selectedSubject.id,
      published: true, // Explicitly publish the list
    };

    try {
      const data = await createListAction(listData);
      const message = isEditMode ? "Lijst succesvol bijgewerkt en gepubliceerd." : "Lijst succesvol gepubliceerd.";
      toast.success(message);
      setHasChanges(false);
      setLastSaved(new Date());

      if (data && typeof data === 'object' && 'list_id' in data) {
        setAutosavedListId(data.list_id);
        router.push(`/learn/viewlist/${data.list_id}`);
      }
    } catch (error) {
      console.error(isEditMode ? "Error updating list" : "Error publishing list", error instanceof Error ? error.stack : error);
      toast.error(`Er trad een fout op bij het ${isEditMode ? 'bijwerken' : 'uploaden'}.`);
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
  }

  return (
    <div className="mx-2 overflow-clip">
      <div className="mx-2">
        {/* Updated back button */}
        <Link
          href="/home/start"
          className="fixed top-4 right-4 z-[150] flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600 drop-shadow-2xl"
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
        </Link>

        <div className="h-3" />
        {/* Make the autosave status more visible */}
        <div className="text-center text-sm my-2 h-5 flex justify-center items-center gap-2">
          {isSaving ? (
            <span className="text-amber-400 font-medium">Wijzigingen worden opgeslagen...</span>
          ) : lastSaved ? (
            <span className="text-emerald-400">
              Laatst opgeslagen: {lastSaved.toLocaleTimeString()}
            </span>
          ) : (
            <span className="text-gray-400">Alle wijzigingen worden automatisch opgeslagen</span>
          )}
        </div>
        <form className="relative z-[1000]">
          <div className="flex flex-row gap-4">
            <Dropdown
              ref={dropdownRef}
              text="Kies een vak"
              width={200}
              dropdownMatrix={Object.entries(subjectEmojiMap).map(([key, value]) => [value, key])}
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
                dropdownMatrix={Object.entries(subjectEmojiMap).map(([key, value]) => [value, key])}
                selectorMode={true}
                onChange={(selected) => setSelectedTaal(selected)}
              />
            </div>
            <div className="w-1/2 pl-28">
              <Dropdown
                ref={naarDropdownRef}
                text="Naar.."
                width={200}
                dropdownMatrix={Object.entries(subjectEmojiMap).map(([key, value]) => [value, key])}
                selectorMode={true}
                disabled={selectedSubject && ["FR", "EN", "DE", "NL"].includes(selectedSubject.id)}
              />
            </div>
          </div>
        </form>
        <div className="h-16" />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => setIsDragging(true)} // NEW: Set dragging state on drag start
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
                  style={{ zIndex: 1000 }} // lowered z-index
                >
                  <SortableItem id={pair.id}>
                    {({ dragListeners }) => (
                      <div
                        className="relative flex flex-col bg-neutral-800 shadow-lg rounded-lg transition-all p-4 cursor-default"
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
            <div className="relative flex items-center rounded-lg bg-neutral-800 shadow-lg p-4 h-20 transition-all hover:bg-neutral-700" style={{ cursor: isDragging ? "grabbing" : "default" }}>
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
          text={isEditMode ? "Lijst publiceren" : "Lijst publiceren"}
          onClick={publishList}
        />
        {/* Only keep the debug button if needed during development */}
        {process.env.NODE_ENV === 'development' && (
          <Button1
            text="Log Raw Data"
            onClick={logRawData}
          />
        )}
      </div>
      <div className="h-8" />
    </div>);
}
