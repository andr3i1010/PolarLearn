"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getUserNameById } from '@/serverActions/getUserName';

interface CreatorLinkProps {
  creator: string;
  color?: string;
  // Add prop for controlling which value to use for Jdenticon
  setJdenticonValue?: (value: string) => void;
}

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function CreatorLink({ creator, color, setJdenticonValue }: CreatorLinkProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>(creator);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check if creator is a UUID
    if (creator && UUID_REGEX.test(creator)) {
      setIsLoading(true);

      // Use server action to get the user info
      getUserNameById(creator)
        .then(userInfo => {
          if (userInfo.name) {
            setDisplayName(userInfo.name);
            
            // Update the Jdenticon value if the callback is provided
            if (setJdenticonValue && userInfo.jdenticonValue) {
              setJdenticonValue(userInfo.jdenticonValue);
            }
          }
        })
        .catch(err => {
          console.error("Error fetching user name:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setDisplayName(creator);
      // For non-UUID values, we can use the creator directly for Jdenticon
      if (setJdenticonValue) {
        setJdenticonValue(creator);
      }
    }
  }, [creator, setJdenticonValue]);

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/home/viewuser/${displayName}`);
  };

  return (
    <span
      className={`${color === 'white' ? 'text-white hover:text-blue-400 transition' : 'text-blue-400'} hover:underline cursor-pointer ${isLoading ? 'opacity-70' : ''}`}
      onClick={handleCreatorClick}
    >
      {isLoading ? '...' : displayName}
    </span>
  );
}
