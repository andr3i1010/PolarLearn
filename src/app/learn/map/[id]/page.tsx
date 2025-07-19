import { prisma } from "@/utils/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth/auth";
import { getMapLists, getAvailableListsForMap } from "@/serverActions/mapActions";
import { getUserNameById } from "@/serverActions/getUserName";
import { AlertTriangle, Folder } from "lucide-react";
import Link from "next/link";
import Button1 from "@/components/button/Button1";
import LijstenMap from "./LijstenMap";
import { Metadata } from "next";

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: { params: { id: Promise<string> } }) {
  const id = await params.id;
  const map = await prisma.map.findUnique({ where: { id } });

  if (!map) {
    return (
      <div className="flex flex-col p-4 items-center justify-center text-center h-[calc(100vh-200px)]">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Map niet gevonden</h1>
        <p className="text-neutral-400 mb-6">
          De map die je zoekt bestaat niet of is mogelijk verwijderd.
        </p>
        <Link href="/learn/groups">
          <Button1 text="Terug naar groepen" />
        </Link>
      </div>
    );
  }

  // Get current user
  const currentUser = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

  // Check permissions - only creator can write, everyone can read if public
  const isCreator = currentUser?.name === map.creator;
  const canView = map.public || isCreator;

  if (!canView) {
    return redirect("/home/start");
  }

  // Get lists in the map
  const mapLists = await getMapLists(id);

  // Prefetch creators for map lists
  const listCreators = Array.from(new Set(mapLists.map(l => l.creator)));
  const creatorMap: Record<string, { name: string; jdenticonValue: string }> = {};
  await Promise.all(listCreators.map(async creator => {
    if (UUID_REGEX.test(creator)) {
      const info = await getUserNameById(creator);
      creatorMap[creator] = { name: info.name || creator, jdenticonValue: info.jdenticonValue || creator };
    } else {
      creatorMap[creator] = { name: creator, jdenticonValue: creator };
    }
  }));

  // Enrich mapLists with prefetched data and sanitize
  const enrichedMapLists = mapLists.map(item => {
    try {
      // Serialize and deserialize to remove any non-serializable objects
      return JSON.parse(JSON.stringify({
        ...item,
        prefetchedName: creatorMap[item.creator]?.name,
        prefetchedJdenticonValue: creatorMap[item.creator]?.jdenticonValue,
        // Ensure data is properly serialized
        data: Array.isArray(item.data) ? item.data : []
      }));
    } catch (error) {
      console.error('Error serializing map list:', error);
      return {
        id: item.id,
        list_id: item.list_id,
        name: item.name || 'Unknown',
        subject: item.subject || '',
        creator: item.creator,
        published: item.published || false,
        mode: item.mode,
        data: [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        prefetchedName: creatorMap[item.creator]?.name,
        prefetchedJdenticonValue: creatorMap[item.creator]?.jdenticonValue,
      };
    }
  });

  // Get available lists for creator
  const availableListsResult = isCreator ? await getAvailableListsForMap(id) : { success: false, lists: [] };
  const availableLists = Array.isArray(availableListsResult?.lists)
    ? availableListsResult.lists.map(list => {
      // Serialize and deserialize to remove any non-serializable objects
      try {
        return JSON.parse(JSON.stringify({
          ...list,
          data: Array.isArray(list.data) ? list.data : [],
          mode: list.mode || 'list'
        }));
      } catch (error) {
        console.error('Error serializing list:', error);
        return {
          list_id: list.list_id || '',
          name: list.name || 'Unknown',
          subject: list.subject || '',
          data: [],
          creator: list.creator || '',
          published: list.published || false,
          mode: list.mode || 'list'
        };
      }
    })
    : [];

  return (
    <div className="mt-4 p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Folder className="h-8 w-8 text-blue-500 mr-3" />
        <div>
          <h1 className="text-3xl font-bold">{map.name}</h1>
        </div>
      </div>

      {/* Content */}
      <LijstenMap
        lists={enrichedMapLists}
        mapId={id}
        isCreator={isCreator}
        currentUserName={currentUser?.name || ''}
        availableLists={availableLists}
      />
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const mapData = await prisma.map.findUnique({
      where: { id }
    });

    if (!mapData) {
      return {
        title: "PolarLearn | Map niet gevonden",
        description: "De gevraagde map kon niet worden gevonden.",
      };
    }

    // Clean the description for metadata (limit length for SEO)
    const cleanDescription = "Bekijk deze map op PolarLearn.";

    return {
      title: `PolarLearn Mappen | ${mapData.name}`,
      description: cleanDescription,
    };
  } catch (error) {
    return {
      title: "PolarLearn | Map",
      description: "Een onbekende fout is opgetreden bij het ophalen van de mapgegevens.",
    };
  }
}