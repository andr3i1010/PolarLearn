import { getUserNameById, getUserIdByName } from '@/serverActions/getUserName';
import CreatorLinkClient from './CreatorLinkClient';

interface CreatorLinkProps {
  creator: string;
  color?: string;
  setJdenticonValue?: (value: string) => void;
  prefetchedName?: string;
  prefetchedJdenticonValue?: string;
}

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CreatorLink({
  creator,
  color,
  setJdenticonValue,
  prefetchedName,
  prefetchedJdenticonValue
}: CreatorLinkProps) {
  let displayName = prefetchedName || creator;
  let jdenticonValue = prefetchedJdenticonValue || creator;
  let userId: string | null = null;

  // If creator is a UUID, fetch the name and use the UUID for navigation
  if (UUID_REGEX.test(creator)) {
    if (!prefetchedName) {
      try {
        const userInfo = await getUserNameById(creator);
        if (userInfo.name) {
          displayName = userInfo.name;
          jdenticonValue = userInfo.jdenticonValue || creator;
        }
      } catch (err) {
        console.error("Error fetching user name on server:", err);
      }
    }
    userId = creator; // Use the UUID for navigation
  } else {
    // If creator is a name, get the UUID for navigation
    try {
      const userInfo = await getUserIdByName(creator);
      if (userInfo.id) {
        userId = userInfo.id;
      }
    } catch (err) {
      console.error("Error fetching user ID on server:", err);
    }
  }

  return (
    <CreatorLinkClient
      displayName={displayName}
      jdenticonValue={jdenticonValue}
      color={color}
      setJdenticonValue={setJdenticonValue}
      userId={userId || undefined}
    />
  );
}
