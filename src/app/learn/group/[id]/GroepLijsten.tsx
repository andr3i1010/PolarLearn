"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreatorLink from '@/components/links/CreatorLink';
import { PencilIcon, MousePointerClick, List, PlusIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSubjectIcon } from '@/components/icons';
import Button1 from '@/components/button/Button1';
import AddListDialog from '@/components/groups/AddListDialog';
import RemoveListFromGroupButton from '@/components/groups/RemoveListFromGroupButton';

// Import learning method images
import learn from '@/app/img/learn.svg';
import test from '@/app/img/test.svg';
import hints from '@/app/img/hint.svg';
import mind from '@/app/img/mind.svg';

interface GroupList {
  id: string;
  list_id: string;
  name: string;
  subject?: string;
  creator: string;
  published?: boolean;
  mode: string;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
  scheduledDeletion?: Date | null;
  prefetchedName?: string;
  prefetchedJdenticonValue?: string;
}

interface GroupListsDisplayProps {
  lists: GroupList[];
  groupId: string;
  isMember: boolean;
  canAddLists: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  currentUserName: string;
  availableLists: any[];
}

export default function GroepLijsten({
  lists,
  groupId,
  isMember,
  canAddLists,
  isCreator,
  isAdmin,
  isPlatformAdmin,
  currentUserName,
  availableLists
}: GroupListsDisplayProps) {
  const [select, setSelect] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const router = useRouter();

  const handleCheckboxChange = (listId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedItems(prev => [...prev, listId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== listId));
    }
  };

  const toggleSelect = () => {
    setSelect(!select);
    // Clear selections when turning off select mode
    if (select) {
      setSelectedItems([]);
    }
  };

  const handleLearn = async (mode: string = 'test') => {
    // Get all selected lists (only lists, not summaries)
    const selectedLists = lists.filter(list =>
      list.mode === "list" && selectedItems.includes(list.list_id)
    );

    if (selectedLists.length === 0) return;

    if (selectedLists.length === 1) {
      // Single list - redirect to the list's viewlist page which has its own selection system
      const listId = selectedLists[0].list_id;
      router.push(`/learn/viewlist/${listId}`);
      return;
    }

    // Multiple lists - collect all word pairs and create a virtual combined list
    const allWordPairs: any[] = [];
    let pairIdCounter = 0;

    selectedLists.forEach(list => {
      if (list.data && Array.isArray(list.data)) {
        list.data.forEach((pair: any) => {
          if (pair["1"] && pair["2"]) { // Only include pairs that have both values
            allWordPairs.push({
              id: pairIdCounter++,
              "1": pair["1"],
              "2": pair["2"]
            });
          }
        });
      }
    });

    if (allWordPairs.length === 0) return;

    // Shuffle the word pairs for better learning experience
    const shuffledWordPairs = [...allWordPairs].sort(() => Math.random() - 0.5);

    // Create a virtual list ID for the combined data
    const combinedListId = `combined-${selectedLists.map(l => l.list_id).join('-')}`;

    // Store the combined word pairs data temporarily (we'll simulate a list)
    try {
      // Create a temporary combined list data structure
      const combinedListData = {
        list_id: combinedListId,
        name: `${selectedLists.length} gecombineerde lijsten`,
        data: shuffledWordPairs,
        lang_from: null,
        lang_to: null,
      };

      // Store in sessionStorage for the custom route to access
      sessionStorage.setItem('combinedListData', JSON.stringify(combinedListData));

      // Get all word pair IDs for the cookie (all pairs since we want to learn them all)
      const allPairIds = shuffledWordPairs.map(pair => pair.id);

      // Set cookies exactly like the viewlist selection system
      document.cookie = `selectedPairs=${JSON.stringify(allPairIds)}; path=/;`;
      document.cookie = `fromLanguage=; path=/;`;
      document.cookie = `toLanguage=; path=/;`;
      document.cookie = `listId=${combinedListId}; path=/;`;

      // Navigate to custom learning
      router.push(`/learn/custom/${mode}`);
    } catch (error) {
      console.error('Error creating combined list:', error);
    }
  };

  // Filter items to only show lists for selection (summaries can't be combined)
  const selectableLists = lists.filter(list => list.mode === "list");

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-grow" />
        {isMember && canAddLists && (
          <AddListDialog groupId={groupId} initialLists={availableLists}>
            <Button1
              text="Lijst toevoegen"
              icon={<PlusIcon size={14} />}
            />
          </AddListDialog>
        )}
      </div>

      {/* Multi-selection controls */}
      {selectableLists.length >= 2 && (
        <div className="pb-4 flex flex-row gap-4">
          <Button1
            text={select ? "Selectie uitzetten" : "Meerdere lijsten selecteren"}
            icon={<MousePointerClick />}
            onClick={toggleSelect}
          />
          {select && selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button1
                text="Leren"
                icon={<Image src={learn} alt="leren" width={16} height={16} />}
                onClick={() => handleLearn('leren')}
                disabled={selectedItems.length < 2}
                wrapText={false}
              />
              <Button1
                text="Toets"
                icon={<Image src={test} alt="toets" width={16} height={16} />}
                onClick={() => handleLearn('test')}
                disabled={selectedItems.length < 2}
                wrapText={false}
              />
              <Button1
                text="Hints"
                icon={<Image src={hints} alt="hints" width={16} height={16} />}
                onClick={() => handleLearn('hints')}
                disabled={selectedItems.length < 2}
                wrapText={false}
              />
              <Button1
                text="Gedachten"
                icon={<Image src={mind} alt="gedachten" width={16} height={16} />}
                onClick={() => handleLearn('mind')}
                disabled={selectedItems.length < 2}
                wrapText={false}
              />
              <Button1
                text="Meerkeuze"
                icon={<List width={16} height={16} />}
                onClick={() => handleLearn('multichoice')}
                disabled={selectedItems.length < 2}
                wrapText={false}
              />
            </div>
          )}
        </div>
      )}

      {lists.length === 0 ? (
        <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
          {isMember
            ? canAddLists
              ? "Deze groep heeft nog geen lijsten. Voeg een lijst toe om te beginnen."
              : "Deze groep heeft nog geen lijsten. Vraag een beheerder om lijsten toe te voegen."
            : "Deze groep heeft nog geen lijsten."}
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => (
            <div key={list.list_id}>
              <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                {/* Selection checkbox */}
                {select && list.mode === "list" && (
                  <div className="relative inline-block mr-4">
                    <input
                      type="checkbox"
                      id={`checkbox-${list.list_id}`}
                      name="selectedItems"
                      value={list.list_id}
                      checked={selectedItems.includes(list.list_id)}
                      onChange={(e) => handleCheckboxChange(list.list_id, e.target.checked)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={`checkbox-${list.list_id}`}
                      className="block w-6 h-6 rounded-full cursor-pointer relative transition-all duration-200"
                      style={{
                        backgroundColor: '#f3f4f6',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: '#d1d5db'
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 opacity-0"
                          fill="none"
                          stroke="#ffffff"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </label>
                    <style jsx>{`
                      input:checked + label {
                        background-color: #38bdf8 !important;
                        border-color: #38bdf8 !important;
                      }
                      input:checked + label svg {
                        opacity: 1 !important;
                      }
                      label:hover {
                        border-color: #38bdf8 !important;
                      }
                    `}</style>
                  </div>
                )}

                <Link href={`${list.mode === "list" ? `/learn/viewlist/${list.list_id}` : `/learn/summary/${list.list_id}`}`} className="flex-1 flex items-center">
                  <div className="flex items-center">
                    {list.subject && (
                      <Image
                        src={getSubjectIcon(list.subject)}
                        alt={`${list.subject} icon`}
                        width={24}
                        height={24}
                        className="mr-2"
                      />
                    )}
                    <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                      {list.name}
                      {list.published === false && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-amber-600/20 text-amber-500 border border-amber-600/50 text-xs"
                        >
                          Concept
                        </Badge>
                      )}
                    </span>
                  </div>
                </Link>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-auto">
                  <CreatorLink
                    creator={list.creator}
                    prefetchedName={list.prefetchedName}
                    prefetchedJdenticonValue={list.prefetchedJdenticonValue}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {(isCreator || list.creator === currentUserName) && (
                    <Link
                      href={`/learn/editlist/${list.list_id}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                      title="Lijst bewerken"
                    >
                      <PencilIcon className="h-5 w-5 text-white" />
                    </Link>
                  )}
                  {(isCreator || isAdmin || isPlatformAdmin) && (
                    <RemoveListFromGroupButton
                      groupId={groupId}
                      listId={list.list_id}
                      isCreator={isCreator}
                      isAdmin={isAdmin}
                      isPlatformAdmin={isPlatformAdmin}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
