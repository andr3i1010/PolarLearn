"use client";
// Beste developer,
// Ik heb mijn tijd enorm verspilt aan alle animaties maken.
// Het zou fijn zijn als jij de animatie zou maken voor als de gebruiker een paar loslaat,
// dus dat het mooi beweegt naar zijn plek.
// ik heb dit al gebrobeerd te doen, maar dat is verschrikkelijk mislukt.
// const wastedHours = 4
// Met vriendelijke groeten, andrei1010

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GripVertical, Import, Plus, Trash2, X } from "lucide-react";
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

async function sendListRequest(listData: any) {
  const isUpdate = !!listData.listId;
  const url = isUpdate ? `/api/v1/lists/${listData.listId}` : `/api/v1/lists`;
  const response = await fetch(url, {
    method: isUpdate ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${isUpdate ? 'updating' : 'creating'} list: ${errorText}`);
  }
  return response.json();
}

// import { createListAction } from "@/serverActions/createList";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { krijgTaalVaken, krijgVak, subjectEmojiMap } from "@/components/icons"; // Import icons from a centralized location
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import Tabs from "@/components/Tabs";

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 50 : 10, // significantly lowered z-index to prevent overlap with alerts
  };

  // Extract attributes and override tabIndex to prevent focus
  const { tabIndex, ...restAttributes } = attributes;
  const modifiedAttributes = {
    ...restAttributes,
    tabIndex: -1, // Override to prevent tab focus on sortable container
  };

  return (
    <div ref={setNodeRef} style={style} {...modifiedAttributes}>
      {children({ dragListeners: listeners })}
    </div>
  );
}

export default function CreateListTool({
  listToEdit,
}: {
  listToEdit?: ListToEdit;
}) {
  const router = useRouter(); // Initialize router
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(
    undefined
  );
  const [listName, setListName] = useState("");
  const dropdownRef = useRef<DropdownHandle>(null);
  const naarDropdownRef = useRef<DropdownHandle>(null);
  const vanDropdownRef = useRef<DropdownHandle>(null); // NEW ref for first language dropdown

  const [pairs, setPairs] = useState<Pair[]>([{ id: 0, "1": "", "2": "" }]);
  const [nextId, setNextId] = useState(1);
  const [selectedPairId, setSelectedPairId] = useState<number | null>(null);
  const [selectedInput, setSelectedInput] = useState<string | null>(null);
  const [translations, setTranslations] = useState<{ [id: number]: string }>(
    {}
  );
  const [leftInputTranslations, setLeftInputTranslations] = useState<{ [id: number]: string }>(
    {}
  );
  const [selectedTaal, setSelectedTaal] = useState<string | undefined>(
    undefined
  );
  const [selectedSubject, setSelectedSubject] = useState<
    { id: string; display: ReactNode } | undefined
  >(undefined);
  const [isDragging, setIsDragging] = useState(false); // NEW state for dragging
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autosavedListId, setAutosavedListId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const debouncedSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null); // NEW: Add timeout ref for translation debouncing
  const reverseTranslationTimeoutRef = useRef<NodeJS.Timeout | null>(null); // NEW: Add timeout ref for reverse translation debouncing
  const currentTranslationRequestRef = useRef<string | null>(null); // NEW: Track current translation request to prevent race conditions
  const currentReverseTranslationRequestRef = useRef<string | null>(null); // NEW: Track current reverse translation request to prevent race conditions
  const [isTranslationButtonFocused, setIsTranslationButtonFocused] = useState(false);
  const isEditMode = listToEdit;
  const [importText, setImportText] = useState<string>("");
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autotranslateEnabled, setAutotranslateEnabled] = useState<boolean>(false);
  const [activeImportTab, setActiveImportTab] = useState<string>("text");

  const languageEntries: [ReactNode, string][] = Object.entries(subjectEmojiMap)
    .filter(([key]) =>
      krijgTaalVaken()
        .map((vak) => vak.afkorting)
        .includes(key)
    )
    .map(([key, value]): [ReactNode, string] => [value, key]);

  useEffect(() => {
    const defaultDutchDisplay = (
      <div className="flex items-center gap-2">
        <Image
          src={krijgVak("NL").icon}
          alt="Nederlands"
          width={20}
          height={20}
        />
        <p>{krijgVak("NL").naam}</p>
      </div>
    );
    if (vanDropdownRef.current) {
      if (
        selectedSubject &&
        krijgTaalVaken()
          .map((vak) => vak.afkorting)
          .includes(selectedSubject.id)
      ) {
        const langDisplay = (
          <div className="flex items-center gap-2">
            <Image
              src={krijgVak(krijgVak(selectedSubject.id).van.afkorting).icon}
              alt={krijgVak(krijgVak(selectedSubject.id).van.afkorting).naam}
              width={20}
              height={20}
            />
            <p>{krijgVak(krijgVak(selectedSubject.id).van.afkorting).naam}</p>
          </div>
        );
        vanDropdownRef.current.setValue(
          krijgVak(selectedSubject.id).van.afkorting,
          langDisplay
        );
      } else {
        vanDropdownRef.current.setValue("NL", defaultDutchDisplay);
      }
    }
    if (naarDropdownRef.current) {
      if (
        selectedSubject &&
        krijgTaalVaken()
          .map((vak) => vak.afkorting)
          .includes(selectedSubject.id)
      ) {
        const langDisplay = (
          <div className="flex items-center gap-2">
            <Image
              src={krijgVak(krijgVak(selectedSubject.id).naar.afkorting).icon}
              alt={krijgVak(krijgVak(selectedSubject.id).naar.afkorting).naam}
              width={20}
              height={20}
            />
            <p>{krijgVak(krijgVak(selectedSubject.id).naar.afkorting).naam}</p>
          </div>
        );
        naarDropdownRef.current.setValue(
          krijgVak(selectedSubject.id).naar.afkorting,
          langDisplay
        );
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
        <Image
          src={krijgVak("NL").icon}
          alt="Nederlands"
          width={20}
          height={20}
        />
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
    return () => {
      document.body.style.cursor = "default";
    };
  }, [isDragging]);

  // Populate form with existing data if editing
  useEffect(() => {
    if (listToEdit) {
      // Set list name
      setListName(listToEdit.name);

      // Set subject
      if (listToEdit.subject) {
        const subjectIcon = krijgVak(listToEdit.subject).icon;
        if (subjectIcon) {
          const subjectDisplay = (
            <div className="flex items-center gap-2">
              <Image
                src={subjectIcon}
                alt={`${listToEdit.subject} icon`}
                width={20}
                height={20}
              />
              <p>{krijgVak(listToEdit.subject).naam}</p>
            </div>
          );

          setSelectedSubject({
            id: listToEdit.subject,
            display: subjectDisplay,
          });
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
          "2": item["2"] || "",
        }));

        setPairs(formattedPairs);
        setNextId(formattedPairs.length);
      }

      // Set language selections
      if (listToEdit.lang_from && vanDropdownRef.current) {
        const langFrom = listToEdit.lang_from;
        const fromIcon = krijgVak(langFrom).icon;
        if (fromIcon) {
          const display = (
            <div className="flex items-center gap-2">
              <Image
                src={fromIcon}
                alt={krijgVak(langFrom).naam}
                width={20}
                height={20}
              />
              <p>{krijgVak(langFrom).naam}</p>
            </div>
          );
          vanDropdownRef.current.setValue(langFrom, display);
        }
      }

      if (listToEdit.lang_to && naarDropdownRef.current) {
        const langTo = listToEdit.lang_to;
        const toIcon = krijgVak(langTo).icon;
        if (toIcon) {
          const display = (
            <div className="flex items-center gap-2">
              <Image
                src={toIcon}
                alt={krijgVak(langTo).naam}
                width={20}
                height={20}
              />
              <p>{krijgVak(langTo).naam}</p>
            </div>
          );
          naarDropdownRef.current.setValue(langTo, display);
        }
      }
    }
  }, [listToEdit]);

  // Cleanup effect to clear translation timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
      if (reverseTranslationTimeoutRef.current) {
        clearTimeout(reverseTranslationTimeoutRef.current);
      }
      // Clear current request tracking
      currentTranslationRequestRef.current = null;
      currentReverseTranslationRequestRef.current = null;
    };
  }, []);

  const addPair = () => {
    setPairs([...pairs, { id: nextId, "1": "", "2": "" }]);
    setNextId(nextId + 1);
    markHasChanges();
    // Clear translation suggestions when adding new pair
    setSelectedPairId(null);
    setSelectedInput(null);
    setTranslations({});
    setLeftInputTranslations({});
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
      prev.map((pair) => (pair.id === id ? { ...pair, "1": value } : pair))
    );
    markHasChanges();

    // Show translation suggestion if autotranslate is enabled and value is not empty
    if (value.trim() && autotranslateEnabled) {
      setSelectedPairId(id);
      setSelectedInput("1");

      // Clear any existing translation timeout to prevent multiple simultaneous requests
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }

      // Clear current request tracking since we're starting a new one
      currentTranslationRequestRef.current = null;

      // Debounce the translation suggestion to avoid too many API calls
      translationTimeoutRef.current = setTimeout(() => {
        handleAutotranslate(value.trim(), id);
      }, 500);
    } else {
      // Clear suggestions if input is empty or autotranslate is disabled
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
      currentTranslationRequestRef.current = null;
      setSelectedPairId(null);
      setSelectedInput(null);
      setTranslations({});
      setLeftInputTranslations({});
    }
  };

  const handleSecondInputChange = (id: number, value: string) => {
    setPairs((prev) =>
      prev.map((pair) => (pair.id === id ? { ...pair, "2": value } : pair))
    );
    markHasChanges();
  };

  // New async function to handle the translation
  const getTranslation = async (
    word: string,
    pairId: number
  ): Promise<void> => {
    if (!word.trim()) return;

    const fromLang = vanDropdownRef.current?.getSelectedItem();
    const toLang = naarDropdownRef.current?.getSelectedItem();

    // Only translate if both languages are set and different
    if (fromLang && toLang && fromLang !== toLang) {
      try {
        const res = await fetch(
          `/api/v1/translate?text=${encodeURIComponent(word)}&to=${toLang}&from=${fromLang}`
        );
        const data = await res.json();
        const translation = data.translation || "";

        // Update the translation (this is for manual focus-triggered translations, so always update)
        if (translation) {
          setTranslations(prev => ({
            ...prev,
            [pairId]: translation,
          }));
        }
      } catch (error) {
        console.error("Translation error", error);
      }
    }
  };

  // New function to get reverse translation (for left input field)
  const getReverseTranslation = async (
    word: string,
    pairId: number
  ): Promise<void> => {
    if (!word.trim()) return;

    const fromLang = naarDropdownRef.current?.getSelectedItem();
    const toLang = vanDropdownRef.current?.getSelectedItem();

    // Only translate if both languages are set and different
    if (fromLang && toLang && fromLang !== toLang) {
      // Create a unique request ID to track this specific reverse translation request
      const requestId = `reverse-${pairId}-${word}-${fromLang}-${toLang}-${Date.now()}`;
      currentReverseTranslationRequestRef.current = requestId;

      try {
        const res = await fetch(
          `/api/v1/translate?text=${encodeURIComponent(word)}&to=${toLang}&from=${fromLang}`
        );
        const data = await res.json();
        const translation = data.translation || "";

        // Only update the translation if this is still the most recent request for this pair
        if (currentReverseTranslationRequestRef.current === requestId && translation) {
          setLeftInputTranslations(prev => ({
            ...prev,
            [pairId]: translation,
          }));
        }
      } catch (error) {
        console.error("Reverse translation error", error);
      }
    }
  };

  // New function to handle autotranslation when languages are different
  const handleAutotranslate = async (
    word: string,
    pairId: number
  ): Promise<void> => {
    if (!word.trim() || !autotranslateEnabled) return;

    const fromLang = vanDropdownRef.current?.getSelectedItem();
    const toLang = naarDropdownRef.current?.getSelectedItem();

    // Only autotranslate if both languages are set and different
    if (fromLang && toLang && fromLang !== toLang) {
      // Create a unique request ID to track this specific request
      const requestId = `${pairId}-${word}-${fromLang}-${toLang}-${Date.now()}`;
      currentTranslationRequestRef.current = requestId;

      try {
        const res = await fetch(
          `/api/v1/translate?text=${encodeURIComponent(word)}&to=${toLang}&from=${fromLang}`
        );
        const data = await res.json();
        const translation = data.translation || "";

        // Only update the translation if this is still the most recent request for this pair
        if (currentTranslationRequestRef.current === requestId && translation) {
          // Store the translation as a suggestion instead of auto-filling
          setTranslations(prev => ({ ...prev, [pairId]: translation }));
        }
      } catch (error) {
        console.error("Autotranslation error", error);
      }
    }
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
  const isLanguage =
    selectedLanguage &&
    krijgTaalVaken()
      .map((vak) => vak.afkorting)
      .includes(selectedLanguage);

  // Function to autosave the list - simplified for reliability
  const autosaveList = async () => {
    // Only check for subject, always save if we have one
    if (!selectedSubject) {
      return;
    }

    setIsSaving(true);

    try {
      // Make sure we have minimal required data
      const formattedPairs = pairs.map((pair) => ({
        id: pair.id,
        "1": pair["1"] || "",
        "2": pair["2"] || "",
      }));

      const listData = {
        listId: listToEdit?.list_id ?? autosavedListId ?? undefined,
        name: listName || "Naamloze Lijst",
        mode: "list",
        data: formattedPairs,
        lang_from: vanDropdownRef.current?.getSelectedItem() || "NL",
        lang_to: naarDropdownRef.current?.getSelectedItem() || "NL",
        subject: selectedSubject.id,
        autosave: true,
        published: false,
      };

      const data = await sendListRequest(listData);

      if (data && typeof data === "object" && "list_id" in data) {
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

  // Monitor language dropdowns for autotranslate
  useEffect(() => {
    const checkAutotranslate = () => {
      const fromLang = vanDropdownRef.current?.getSelectedItem();
      const toLang = naarDropdownRef.current?.getSelectedItem();

      // Enable autotranslate when both languages are set and different
      const shouldEnable = Boolean(
        fromLang &&
        toLang &&
        fromLang !== toLang &&
        krijgTaalVaken().some((vak) => vak.afkorting === fromLang) &&
        krijgTaalVaken().some((vak) => vak.afkorting === toLang)
      );

      setAutotranslateEnabled(shouldEnable);
    };

    // Check immediately
    checkAutotranslate();

    // Set up periodic check to detect dropdown changes
    const interval = setInterval(checkAutotranslate, 100);

    return () => clearInterval(interval);
  }, []);

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
    const hasFilledPair = pairs.some((pair) => pair["1"].trim() !== "");
    if (!hasFilledPair) {
      toast.error("Vul ten minste één paar in.");
      return;
    }

    const formattedPairs = pairs.map((pair) => ({
      id: pair.id,
      "1": pair["1"] || "",
      "2": pair["2"] || "",
    }));

    const listData = {
      listId: listToEdit?.list_id ?? autosavedListId ?? undefined,
      name: listName || "Naamloze Lijst",
      mode: "list",
      data: formattedPairs,
      lang_from: vanDropdownRef.current?.getSelectedItem(),
      lang_to: naarDropdownRef.current?.getSelectedItem(),
      subject: selectedSubject.id,
      published: true, // Explicitly publish the list
    };

    try {
      const data = await sendListRequest(listData);
      const message = isEditMode
        ? "Lijst succesvol bijgewerkt en gepubliceerd."
        : "Lijst succesvol gepubliceerd.";
      toast.success(message);
      setHasChanges(false);
      setLastSaved(new Date());

      if (data && typeof data === "object" && "list_id" in data) {
        setAutosavedListId(data.list_id);
        router.push(`/learn/viewlist/${data.list_id}`);
      }
    } catch (error) {
      console.error(
        isEditMode ? "Error updating list" : "Error publishing list",
        error instanceof Error ? error.stack : error
      );
      toast.error(
        `Er trad een fout op bij het ${isEditMode ? "bijwerken" : "uploaden"}.`
      );
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

  const parseCsv = (csvContent: string): string[][] => {
    const lines = csvContent.split("\n");
    const result: string[][] = [];

    for (const line of lines) {
      if (line.trim() === "") continue;

      const row: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quotes
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          // End of field
          row.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }

      // Add the last field
      row.push(current.trim());

      if (row.some((cell) => cell !== "")) {
        result.push(row);
      }
    }

    return result;
  };

  const handleCsvImport = useCallback(
    (csvContent: string) => {
      try {
        if (!csvContent.trim()) {
          toast.error("CSV bestand is leeg");
          return;
        }

        const csvData = parseCsv(csvContent);

        if (csvData.length === 0) {
          toast.error("Geen geldige data gevonden in het CSV bestand");
          return;
        }

        const newPairs: Pair[] = csvData
          .map((row, index) => ({
            id: nextId + index,
            "1": row[0]?.trim() || "",
            "2": row[1]?.trim() || "",
          }))
          .filter((pair) => pair["1"] !== "" || pair["2"] !== "");

        if (newPairs.length === 0) {
          toast.error("Geen geldige items gevonden in het CSV bestand");
          return;
        }

        // Add the new pairs to the existing ones
        setPairs([...pairs, ...newPairs]);
        setNextId(nextId + newPairs.length);
        markHasChanges();

        // Close the dialog and reset
        setImportDialogOpen(false);
        setActiveImportTab("text"); // Reset to default tab
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        toast.success(
          `${newPairs.length} items succesvol geïmporteerd uit CSV`
        );
      } catch (error) {
        console.error("CSV import error:", error);
        toast.error(
          "Er is een fout opgetreden bij het importeren van het CSV bestand"
        );
      }
    },
    [
      nextId,
      pairs,
      setPairs,
      setNextId,
      markHasChanges,
      setImportDialogOpen,
      toast,
    ]
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Alleen CSV bestanden zijn toegestaan");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleCsvImport(content);
      };
      reader.onerror = () => {
        toast.error("Fout bij het lezen van het bestand");
      };
      reader.readAsText(file);
    },
    [handleCsvImport, toast]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const csvFile = files.find((file) =>
        file.name.toLowerCase().endsWith(".csv")
      );

      if (!csvFile) {
        toast.error("Alleen CSV bestanden zijn toegestaan");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleCsvImport(content);
      };
      reader.onerror = () => {
        toast.error("Fout bij het lezen van het bestand");
      };
      reader.readAsText(csvFile);
    },
    [handleCsvImport, toast]
  );

  const handleImport = useCallback(() => {
    try {
      if (!importText.trim()) {
        toast.error("Voer een lijst in om te importeren");
        return;
      }

      // Split de regels van de tekst
      const lines = importText.split("\n").filter((line) => line.trim() !== "");
      const separator = ":"; // NOTE: hier kan regex komen maar ik kan dat niet

      // hier gaan we naar schrijven
      let newPairs: Pair[] = [];

      if (lines.length === 0) {
        toast.error("De geïmporteerde tekst bevat geen geldige regels");
        return;
      }
      if (lines[0].includes(separator)) {
        newPairs = lines
          .map((line, index) => {
            const parts = line.split(separator);
            return {
              id: nextId + index,
              "1": parts[0]?.trim() || "",
              "2": parts[1]?.trim() || "",
            };
          })
          .filter((pair) => pair["1"] !== "" || pair["2"] !== "");
      } else {
        let vragen: string[] = [];
        let antwoorden: string[] = [];

        lines.forEach((line, index) => {
          if (index % 2 === 0) {
            vragen.push(line.trim());
          } else {
            antwoorden.push(line.trim());
          }
        });
        newPairs = vragen
          .map((vraag, index) => {
            return {
              id: nextId + index,
              "1": vraag,
              "2": antwoorden[index] || "", // If no answer is provided, set it to an empty string
            };
          })
          .filter((pair) => pair["1"] !== "" || pair["2"] !== "");
      }
      if (newPairs.length === 0) {
        toast.error("Geen geldige items gevonden in de geïmporteerde tekst");
        return;
      }

      // Add the new pairs to the existing ones
      setPairs([...pairs, ...newPairs]);
      setNextId(nextId + newPairs.length);
      markHasChanges();

      // Close the dialog and reset the input
      setImportDialogOpen(false);
      setImportText("");
      setActiveImportTab("text"); // Reset to default tab

      toast.success(`${newPairs.length} items succesvol geïmporteerd`);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Er is een fout opgetreden bij het importeren van de lijst");
    }
  }, [
    importText,
    nextId,
    pairs,
    setPairs,
    setNextId,
    markHasChanges,
    setImportDialogOpen,
    setImportText,
    toast,
  ]);

  // Cleanup effect for timeouts
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      if (debouncedSaveTimeoutRef.current) {
        clearTimeout(debouncedSaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="mx-2 overflow-visible">
      <div className="mx-2">
        {/* Updated back button */}
        <Link
          href="/home/start"
          className="fixed top-4 right-4 z-[150] flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600 drop-shadow-2xl"
        >
          <X />
        </Link>

        <div className="h-3" />
        {/* Make the autosave status more visible */}
        <div className="text-center text-sm my-2 h-5 flex justify-center items-center gap-2">
          {isSaving ? (
            <span className="text-amber-400 font-medium">
              Wijzigingen worden opgeslagen...
            </span>
          ) : lastSaved ? (
            <span className="text-emerald-400">
              Laatst opgeslagen: {lastSaved.toLocaleTimeString()}
            </span>
          ) : (
            <span className="text-gray-400">
              Alle wijzigingen worden automatisch opgeslagen
            </span>
          )}
        </div>
        <form className="relative">
          <div className="flex flex-row gap-4">
            <Dropdown
              ref={dropdownRef}
              text="Kies een vak"
              width={200}
              dropdownMatrix={Object.entries(subjectEmojiMap).map(
                ([key, value]) => [value, key]
              )}
              selectorMode={true}
              onChangeSelected={(selected) => {
                setSelectedSubject(selected);
                setSelectedLanguage(selected.id);
              }}
              zIndex={50}
            />
          </div>
          <div className="mt-16 flex items-center gap-3">
            <Input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="bg-neutral-800 text-white h-12 w-full rounded-lg text-center text-xl"
              type="text"
              placeholder="Lijstnaam komt hier"
            />
            <Dialog
              open={importDialogOpen}
              onOpenChange={(open) => {
                setImportDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <button
                  className="flex items-center justify-center h-12 w-12 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-all border-2 border-neutral-700 hover:border-neutral-600 hover:scale-110"
                  title="Lijst importeren (tekst of CSV)"
                >
                  <Import size={20} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Importeer een lijst</DialogTitle>
                  <DialogDescription>
                    Kies hoe je je lijst wilt importeren:
                  </DialogDescription>
                </DialogHeader>

                <Tabs
                  tabs={[
                    {
                      id: "text",
                      label: "Tekst plakken",
                      content: (
                        <div className="mt-4">
                          <p className="text-sm text-neutral-400 mb-3">
                            Ondersteunde formaten:
                            <br />• Elk item op één regel: "woord : vertaling"
                            <br />• Afwisselende regels: woord en vertaling op
                            aparte regels
                          </p>
                          <Textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Format 1 (met scheidingsteken):&#10;woord1 : vertaling1&#10;woord2 : vertaling2&#10;&#10;Format 2 (afwisselende regels):&#10;le dos&#10;de rug&#10;le bras&#10;de arm"
                            className="resize-none h-40 bg-neutral-800 text-white"
                          />
                        </div>
                      ),
                    },
                    {
                      id: "csv",
                      label: "CSV bestand",
                      content: (
                        <div className="mt-4">
                          <p className="text-sm text-neutral-400 mb-3">
                            Upload een CSV bestand met twee kolommen:
                            <br />• Eerste kolom: woord/begrip
                            <br />• Tweede kolom: vertaling/uitleg
                            <br />• Geen headers vereist
                          </p>
                          <div
                            className="border-2 border-dashed border-neutral-600 rounded-lg p-6 text-center hover:border-neutral-500 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".csv"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="csvFileInput"
                            />
                            <label
                              htmlFor="csvFileInput"
                              className="cursor-pointer flex flex-col items-center space-y-2"
                            >
                              <Import size={24} className="text-neutral-400" />
                              <span className="text-sm text-neutral-300">
                                Klik om CSV bestand te selecteren
                              </span>
                              <span className="text-xs text-neutral-500">
                                of sleep bestand hierheen
                              </span>
                            </label>
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "sg",
                      label: "StudyGo",
                      content: (
                        <div>
                          <p className="text-xl font-bold">Helaas kunnen wij door copyright-gerelateerde redenen deze functie niet maken.</p>
                          Hoewel, je kan op de print pagina van een lijst alles uit kopieren en dan het plakken in de tekstvan van de "Tekst plakken" tab.
                        </div>
                      )
                    }
                  ]}
                  defaultActiveTab="text"
                  onTabChange={(tabId) => setActiveImportTab(tabId)}
                />

                <div className="flex justify-end mt-4 gap-2">
                  <Button1
                    text="Annuleren"
                    onClick={() => {
                      setImportDialogOpen(false);
                      setImportText("");
                      setActiveImportTab("text"); // Reset to default tab
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  />
                  <Button1
                    text="Importeren"
                    onClick={() => handleImport()}
                    icon={<Import size={16} />}
                    disabled={activeImportTab === "sg"}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-4 flex justify-center gap-4">
            <div className="w-1/2 md:ml-52">
              <Dropdown
                ref={vanDropdownRef}
                text="Van.."
                width={200}
                dropdownMatrix={languageEntries}
                selectorMode={true}
                onChange={(selected) => setSelectedTaal(selected)}
                zIndex={50}
              />
            </div>
            <div className="w-1/2 md:pl-28">
              <Dropdown
                ref={naarDropdownRef}
                text="Naar.."
                width={200}
                dropdownMatrix={languageEntries}
                selectorMode={true}
                zIndex={50}
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
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    transition: { duration: 0.2 },
                  }}
                  style={{ zIndex: 10 }} // significantly lowered z-index to prevent overlap with alerts
                  tabIndex={-1}
                >
                  <SortableItem id={pair.id}>
                    {({ dragListeners }) => (
                      <div
                        className="relative flex flex-col bg-neutral-800 shadow-lg rounded-lg transition-all p-4 cursor-default"
                        tabIndex={-1}
                      >
                        <div className="flex flex-row items-center gap-2">
                          <span className="text-white mr-2 text-xl">
                            {index + 1}
                          </span>

                          <div className="flex flex-col md:flex-row items-center gap-2 w-full">
                            <Input
                              value={pair["1"]}
                              onChange={(e) =>
                                handleWordChange(pair.id, e.target.value)
                              }
                              onFocus={() => {
                                // Clear any pending blur timeout
                                if (blurTimeoutRef.current) {
                                  clearTimeout(blurTimeoutRef.current);
                                  blurTimeoutRef.current = null;
                                }
                                setSelectedPairId(pair.id);
                                setSelectedInput("word");
                                // Small delay to ensure state is set before fetching translation
                                setTimeout(() => {
                                  const trimmedWord = pair["2"].trim();
                                  if (trimmedWord.length > 0) {
                                    // Clear any existing reverse translation request
                                    currentReverseTranslationRequestRef.current = null;
                                    getReverseTranslation(pair["2"], pair.id);
                                  }
                                }, 50);
                              }}
                              onBlur={(e) => {
                                // Don't clear state if clicking on a translation button or if translation button is focused
                                const relatedTarget = e.relatedTarget as HTMLElement;
                                if ((relatedTarget && relatedTarget.closest('[data-translation-button="true"]')) ||
                                  isTranslationButtonFocused) {
                                  return;
                                }
                                // Use timeout to allow button click to process
                                blurTimeoutRef.current = setTimeout(() => {
                                  setSelectedPairId(null);
                                  setSelectedInput(null);
                                  setLeftInputTranslations({});
                                }, 150);
                              }}
                              className="bg-neutral-700 text-white h-12 flex-grow rounded-lg text-center pr-4 text-xl"
                              type="text"
                              placeholder={
                                isLanguage
                                  ? "Woord in het " +
                                  (krijgVak(
                                    vanDropdownRef.current?.getSelectedItem() ||
                                    "NL"
                                  )?.naam || "")
                                  : "Begrip"
                              }
                              data-pair-id={pair.id}
                              data-input-type="1"
                            />
                            <Input
                              value={pair["2"]}
                              onChange={(e) =>
                                handleSecondInputChange(pair.id, e.target.value)
                              }
                              onFocus={() => {
                                // Clear any pending blur timeout
                                if (blurTimeoutRef.current) {
                                  clearTimeout(blurTimeoutRef.current);
                                  blurTimeoutRef.current = null;
                                }
                                setSelectedPairId(pair.id);
                                setSelectedInput("secondInput");
                                // Small delay to ensure state is set before fetching translation
                                setTimeout(() => {
                                  const trimmedWord = pair["1"].trim();
                                  if (trimmedWord.length > 0) {
                                    getTranslation(pair["1"], pair.id);
                                  }
                                }, 50);
                              }}
                              onBlur={(e) => {
                                // Don't clear state if clicking on a translation button or if translation button is focused
                                const relatedTarget = e.relatedTarget as HTMLElement;
                                if ((relatedTarget && relatedTarget.closest('[data-translation-button="true"]')) ||
                                  isTranslationButtonFocused) {
                                  return;
                                }
                                // Use timeout to allow button click to process
                                blurTimeoutRef.current = setTimeout(() => {
                                  setSelectedPairId(null);
                                  setSelectedInput(null);
                                  setTranslations({});
                                }, 150);
                              }}
                              onKeyDown={(e) => {
                                // Check if Tab key is pressed and this is the last input of the last pair
                                if (e.key === "Tab" && !e.shiftKey) {
                                  const isLastPair = index === pairs.length - 1;
                                  if (isLastPair) {
                                    e.preventDefault();
                                    // Add new pair
                                    const newPair = {
                                      id: nextId,
                                      "1": "",
                                      "2": "",
                                    };
                                    setPairs([...pairs, newPair]);
                                    setNextId(nextId + 1);
                                    markHasChanges();

                                    // Focus the first input of the new pair after it's rendered
                                    setTimeout(() => {
                                      const newPairInput =
                                        document.querySelector(
                                          `input[data-pair-id="${nextId}"][data-input-type="1"]`
                                        ) as HTMLInputElement;
                                      if (newPairInput) {
                                        newPairInput.focus();
                                      }
                                    }, 0);
                                  }
                                }
                              }}
                              className="bg-neutral-700 text-white h-12 flex-grow rounded-lg text-center pl-4 text-xl"
                              type="text"
                              placeholder={
                                isLanguage
                                  ? "Vertaling"
                                  : "Uitleg van het begrip"
                              }
                              data-pair-id={pair.id}
                              data-input-type="2"
                            />
                          </div>
                          <div className="flex flex-col md:flex-row items-center">
                            <div
                              className="cursor-grab"
                              {...dragListeners}
                              onMouseDown={(e) =>
                                (e.currentTarget.style.cursor = "grabbing")
                              }
                              onMouseUp={(e) =>
                                (e.currentTarget.style.cursor = "grab")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.cursor = "grab")
                              }
                              tabIndex={-1}
                            >
                              <GripVertical />
                            </div>
                            <button
                              onClick={() => removePair(pair.id)}
                              className="ml-2 flex-none cursor-pointer"
                              tabIndex={-1}
                            >
                              <Trash2 />
                            </button>
                          </div>
                        </div>
                        {translations[pair.id] &&
                          selectedPairId === pair.id &&
                          selectedInput === "secondInput" && (
                            <div className="mt-2 border-t border-neutral-600 pt-2 flex justify-end">
                              <div
                                data-translation-button="true"
                                onFocus={() => setIsTranslationButtonFocused(true)}
                                onBlur={() => setIsTranslationButtonFocused(false)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setPairs((p) =>
                                      p.map((innerPair) =>
                                        innerPair.id === pair.id
                                          ? {
                                            ...innerPair,
                                            "2": translations[pair.id],
                                          }
                                          : innerPair
                                      )
                                    );
                                    setTranslations((prev) => {
                                      const { [pair.id]: removed, ...rest } =
                                        prev;
                                      return rest;
                                    });
                                    // Clear the selection state after applying translation
                                    setSelectedPairId(null);
                                    setSelectedInput(null);
                                  }
                                }}
                              >
                                <Button1
                                  text={translations[pair.id]}
                                  tabIndex={0}
                                  onClick={() => {
                                    setPairs((p) =>
                                      p.map((innerPair) =>
                                        innerPair.id === pair.id
                                          ? {
                                            ...innerPair,
                                            "2": translations[pair.id],
                                          }
                                          : innerPair
                                      )
                                    );
                                    setTranslations((prev) => {
                                      const { [pair.id]: removed, ...rest } =
                                        prev;
                                      return rest;
                                    });
                                    // Clear the selection state after applying translation
                                    setSelectedPairId(null);
                                    setSelectedInput(null);
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        {leftInputTranslations[pair.id] &&
                          selectedPairId === pair.id &&
                          selectedInput === "word" && (
                            <div className="mt-2 border-t border-neutral-600 pt-2 flex justify-start">
                              <div
                                data-translation-button="true"
                                onFocus={() => setIsTranslationButtonFocused(true)}
                                onBlur={() => setIsTranslationButtonFocused(false)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setPairs((p) =>
                                      p.map((innerPair) =>
                                        innerPair.id === pair.id
                                          ? {
                                            ...innerPair,
                                            "1": leftInputTranslations[pair.id],
                                          }
                                          : innerPair
                                      )
                                    );
                                    setLeftInputTranslations((prev) => {
                                      const { [pair.id]: removed, ...rest } =
                                        prev;
                                      return rest;
                                    });
                                    // Clear the selection state after applying translation
                                    setSelectedPairId(null);
                                    setSelectedInput(null);
                                  }
                                }}
                              >
                                <Button1
                                  text={leftInputTranslations[pair.id]}
                                  tabIndex={0}
                                  onClick={() => {
                                    setPairs((p) =>
                                      p.map((innerPair) =>
                                        innerPair.id === pair.id
                                          ? {
                                            ...innerPair,
                                            "1": leftInputTranslations[pair.id],
                                          }
                                          : innerPair
                                      )
                                    );
                                    setLeftInputTranslations((prev) => {
                                      const { [pair.id]: removed, ...rest } =
                                        prev;
                                      return rest;
                                    });
                                    // Clear the selection state after applying translation
                                    setSelectedPairId(null);
                                    setSelectedInput(null);
                                  }}
                                />
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </SortableItem>
                </motion.div>
              ))}
            </AnimatePresence>
            <div
              className="relative flex items-center rounded-lg bg-neutral-800 shadow-lg p-4 h-20 transition-all hover:bg-neutral-700"
              style={{ cursor: isDragging ? "grabbing" : "default" }}
            >
              <button
                onClick={addPair}
                className="absolute inset-0 flex items-center justify-center gap-2 text-xl"
              >
                <Plus />
                <span>Nieuw paar</span>
              </button>
            </div>
            <div className="h-1" />
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-4 flex justify-center space-x-4">
        <Button1
          text={isEditMode ? "Lijst updaten" : "Lijst publiceren"}
          onClick={publishList}
        />
        {process.env.NODE_ENV === "development" && (
          <Button1 text="Log Raw Data" onClick={logRawData} />
        )}
      </div>
      <div className="h-8" />
    </div>
  );
}
