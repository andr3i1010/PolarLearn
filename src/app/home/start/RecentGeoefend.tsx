"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreatorLink from '@/components/links/CreatorLink';
import { PencilIcon, MousePointerClick, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DeleteListButton from '@/components/learning/DeleteListButton';
import DeleteSummaryButton from '@/components/learning/DeleteSummaryButton';
import { getSubjectIcon } from '@/components/icons';
import Button1 from '@/components/button/Button1';

// Import learning method images
import learn from '@/app/img/learn.svg';
import test from '@/app/img/test.svg';
import hints from '@/app/img/hint.svg';
import mind from '@/app/img/mind.svg';

interface RecentGeoefendProps {
  items: Array<any>;
  currentUserName?: string;
  isAdmin?: boolean;
}

export default function RecentGeoefend({ items, currentUserName, isAdmin }: RecentGeoefendProps) {
  const [select, setSelect] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const router = useRouter();

  const handleCheckboxChange = (itemId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
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
    // Get all selected lists (filter out summaries as they can't be combined for learning)
    const selectedLists = items.filter(item =>
      item.type === 'list' && selectedItems.includes(item.list_id)
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
  const selectableItems = items.filter(item => item.type === 'list');
  return (
    <div className="recent-practiced">
      <div className="space-y-4 relative">
        <div
          id="pixel-area-start"
          style={{
            position: 'absolute',
            top: '0px',
            left: '16px',
            width: 'calc(100% - 32px)',
            height: '154px',
          }}
        />

        {/* Multi-selection controls */}
        {selectableItems.length >= 2 && (
          <div className="px-3 pt-1 pb-4 flex flex-row gap-4">
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

        {items.length === 0 ? (
          <>
            <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
              Je hebt nog niets geoefend. Leer een lijst of maak een samenvatting, en deze komen hier te staan.
            </div>
            <div className="tile bg-neutral-800 text-white font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid " />
          </>
        ) : (
          items.map((item: any) => {
            if (item.type === 'list') {
              return (
                <div key={item.list_id} className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between">
                  {/* Selection checkbox */}
                  {select && (
                    <div className="relative inline-block mr-4">
                      <input
                        type="checkbox"
                        id={`checkbox-${item.list_id}`}
                        name="selectedItems"
                        value={item.list_id}
                        checked={selectedItems.includes(item.list_id)}
                        onChange={(e) => handleCheckboxChange(item.list_id, e.target.checked)}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={`checkbox-${item.list_id}`}
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

                  {!select && (
                    <Link href={`/learn/viewlist/${item.list_id}`} className="absolute inset-0 z-0" />
                  )}

                  <div className="flex-1 flex items-center relative z-10 pointer-events-none">
                    <div className="flex items-center">
                      {item.subject && (
                        <Image
                          src={getSubjectIcon(item.subject)}
                          alt={`${item.subject} icon`}
                          width={24}
                          height={24}
                          className="mr-2"
                        />
                      )}
                      <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                        {item.name}
                        {item.published === false && (
                          <Badge variant="secondary" className="ml-2 bg-amber-600/20 text-amber-500 border border-amber-600/50 text-xs">
                            Concept
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex-grow" />
                    <div className="flex items-center pr-2">
                      {Array.isArray(item.data) && item.data.length === 1
                        ? '1 woord'
                        : `${Array.isArray(item.data) ? item.data.length : 0} woorden`}
                    </div>
                  </div>

                  {item.creator && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center z-10">
                      <div className="pointer-events-auto">
                        <CreatorLink
                          creator={item.creator}
                          prefetchedName={item.prefetchedName}
                          prefetchedJdenticonValue={item.prefetchedJdenticonValue}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 relative z-10">
                    {(item.creator === currentUserName || isAdmin) && (
                      <Link
                        href={`/learn/editlist/${item.list_id}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                        title="Lijst bewerken"
                      >
                        <PencilIcon className="h-5 w-5 text-white" />
                      </Link>
                    )}
                    {(item.creator === currentUserName || isAdmin) && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                        <DeleteListButton listId={item.list_id} isCreator={true} />
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (item.type === 'summary') {
              return (
                <div key={item.list_id} className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between">
                  <Link href={`/learn/summary/${item.list_id}`} className="absolute inset-0 z-0" />
                  <div className="flex-1 flex items-center relative z-10 pointer-events-none">
                    <div className="flex items-center">
                      {item.subject && (
                        <Image
                          src={getSubjectIcon(item.subject)}
                          alt={`${item.subject} icon`}
                          width={24}
                          height={24}
                          className="mr-2"
                        />
                      )}
                      <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                        {item.name}
                        {item.published === false && (
                          <Badge variant="secondary" className="ml-2 bg-amber-600/20 text-amber-500 border border-amber-600/50 text-xs">
                            Concept
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>

                  {item.creator && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center z-10">
                      <div className="pointer-events-auto">
                        <CreatorLink
                          creator={item.creator}
                          prefetchedName={item.prefetchedName}
                          prefetchedJdenticonValue={item.prefetchedJdenticonValue}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 relative z-10">
                    <Link
                      href={`/learn/editsummary/${item.list_id}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                      title="Samenvatting bewerken"
                    >
                      <PencilIcon className="h-5 w-5 text-white" />
                    </Link>
                    {(item.creator === currentUserName || isAdmin) && (
                      <DeleteSummaryButton summaryId={item.list_id} />
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
      </div>
    </div>
  );
}
