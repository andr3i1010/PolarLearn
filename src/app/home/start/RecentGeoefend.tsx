"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CreatorLink from '@/components/links/CreatorLink';
import { PencilIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DeleteListButton from '@/components/learning/DeleteListButton';
import DeleteSummaryButton from '@/components/learning/DeleteSummaryButton';
import { getSubjectIcon } from '@/components/icons';

interface RecentGeoefendProps {
  items: Array<any>;
  currentUserName?: string;
  isAdmin?: boolean;
}

export default function RecentGeoefend({ items, currentUserName, isAdmin }: RecentGeoefendProps) {
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
                  <Link href={`/learn/viewlist/${item.list_id}`} className="absolute inset-0 z-0" />
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
