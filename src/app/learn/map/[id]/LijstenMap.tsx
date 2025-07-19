"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreatorLink from '@/components/links/CreatorLink';
import { PencilIcon, List, PlusIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSubjectIcon } from '@/components/icons';
import Button1 from '@/components/button/Button1';
import AddListToMapDialog from '@/components/mappen/AddListToMapDialog';
import RemoveListFromMapButton from '@/components/mappen/RemoveListFromMapButton';

interface MapList {
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

interface AvailableList {
  list_id: string;
  name: string;
  subject: string;
  data: any;
  creator: string;
  published: boolean;
  mode?: string;
}

interface MapListsDisplayProps {
  lists: MapList[];
  mapId: string;
  isCreator: boolean;
  currentUserName: string;
  availableLists: AvailableList[];
}

export default function LijstenMap({
  lists,
  mapId,
  isCreator,
  currentUserName,
  availableLists,
}: MapListsDisplayProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      {isCreator && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Lijsten in deze map</h2>
          <AddListToMapDialog mapId={mapId} initialLists={availableLists}>
            <Button1
              text="Lijst toevoegen"
              icon={<PlusIcon className="h-4 w-4" />}
            />
          </AddListToMapDialog>
        </div>
      )}

      {/* Lists Display */}
      {lists.length === 0 ? (
        <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
          {isCreator
            ? "Deze map heeft nog geen lijsten. Voeg een lijst toe om te beginnen."
            : "Deze map heeft nog geen lijsten."
          }
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => (
            <div key={list.list_id}>
              <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
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
                  {isCreator && (
                    <Link
                      href={`/learn/editlist/${list.list_id}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                      title="Lijst bewerken"
                    >
                      <PencilIcon className="h-5 w-5 text-white" />
                    </Link>
                  )}
                  {isCreator && (
                    <RemoveListFromMapButton
                      mapId={mapId}
                      listId={list.list_id}
                      listName={list.name}
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