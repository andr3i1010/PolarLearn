import { getUserNameById, getUserIdByName } from '@/serverActions/getUserName';
import { isUUID } from './uuid';

export interface CreatorInfo {
  name: string;
  jdenticonValue: string;
  userId?: string;
}

/**
 * Prefetches creator information to avoid client-side waterfalls
 * @param creators Array of creator identifiers (UUIDs or usernames)
 * @returns Map of creator identifier to creator info
 */
export async function prefetchCreatorInfo(creators: string[]): Promise<Record<string, CreatorInfo>> {
  const uniqueCreators = Array.from(new Set(creators));
  const creatorMap: Record<string, CreatorInfo> = {};

  await Promise.all(
    uniqueCreators.map(async creator => {
      try {
        if (isUUID(creator)) {
          const info = await getUserNameById(creator);
          creatorMap[creator] = {
            name: info.name || creator,
            jdenticonValue: info.jdenticonValue || creator,
            userId: creator,
          };
        } else {
          const info = await getUserIdByName(creator);
          creatorMap[creator] = {
            name: creator,
            jdenticonValue: creator,
            userId: info.id || undefined,
          };
        }
      } catch (error) {
        console.error(`Error fetching creator info for ${creator}:`, error);
        // Fallback to using the creator identifier as-is
        creatorMap[creator] = {
          name: creator,
          jdenticonValue: creator,
          userId: isUUID(creator) ? creator : undefined,
        };
      }
    })
  );

  return creatorMap;
}
