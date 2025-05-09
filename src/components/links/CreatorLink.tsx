import { getUserNameById } from '@/serverActions/getUserName';
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

  // If we don't have a prefetched name and creator is a UUID, fetch it server-side
  if (!prefetchedName && creator && UUID_REGEX.test(creator)) {
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

  return (
    <CreatorLinkClient
      displayName={displayName}
      jdenticonValue={jdenticonValue}
      color={color}
      setJdenticonValue={setJdenticonValue}
    />
  );
}
