"use client";
import React, { useState, useEffect } from 'react';
import { getUserNameById, getUserIdByName } from '@/serverActions/getUserName';
import CreatorLinkClient from './CreatorLinkClient';
import { isUUID } from '@/utils/uuid';

interface CreatorLinkProps {
  creator: string;
  color?: string;
  setJdenticonValue?: (value: string) => void;
  prefetchedName?: string;
  prefetchedJdenticonValue?: string;
}

export default function CreatorLink({
  creator,
  color,
  setJdenticonValue,
  prefetchedName,
  prefetchedJdenticonValue
}: CreatorLinkProps) {
  const [displayName, setDisplayName] = useState(prefetchedName || creator);
  const [jdenticonValue, setJdenticon] = useState(prefetchedJdenticonValue || creator);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function resolveCreator() {
      if (isUUID(creator)) {
        setUserId(creator);
        if (!prefetchedName) {
          try {
            const info = await getUserNameById(creator);
            if (info.name) {
              setDisplayName(info.name);
              setJdenticon(info.jdenticonValue || creator);
            }
          } catch (e) {
            console.error("Error fetching user name on client:", e);
          }
        }
      } else {
        try {
          const info = await getUserIdByName(creator);
          if (info.id) setUserId(info.id);
        } catch (e) {
          console.error("Error fetching user ID on client:", e);
        }
      }
    }
    resolveCreator();
  }, [creator, prefetchedName]);

  return (
    <CreatorLinkClient
      displayName={displayName}
      jdenticonValue={jdenticonValue}
      color={color}
      setJdenticonValue={setJdenticonValue}
      userId={userId}
    />
  );
}
