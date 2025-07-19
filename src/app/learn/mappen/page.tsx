import { prisma } from "@/utils/prisma";
import { CreateMapButton } from "./clientComponents";
import Link from "next/link";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { Badge } from "@/components/ui/badge";
import { Folder, FolderOpen } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mappen",
  description: "Je mappen",
};

export default async function MappenPage() {
  const user = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

  if (!user) {
    return <div>Je moet ingelogd zijn om mappen te zien.</div>;
  }

  // Get all maps created by the user
  const userMaps = await prisma.map.findMany({
    where: {
      creator: user.name || user.id
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Count lists in each map
  const mapsWithCounts = await Promise.all(
    userMaps.map(async (map) => {
      const listCount = map.lists?.length || 0;
      return {
        ...map,
        listCount
      };
    })
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold">Mappen</h1>
        <CreateMapButton />
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4">Mijn Mappen</h2>
        {mapsWithCounts.length === 0 ? (
          <div className="bg-neutral-800 text-neutral-400 rounded-lg p-6 text-center">
            <Folder className="h-16 w-16 mx-auto mb-4 text-neutral-500" />
            <p className="mb-4">Je hebt nog geen mappen aangemaakt.</p>
            <p>Maak een map aan om je lijsten te organiseren.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mapsWithCounts.map((map) => (
              <div key={map.id}>
                <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                  <Link href={`/learn/map/${map.id}`} className="flex-1 flex items-center">
                    <div className="flex items-center gap-3">
                      {map.public ? (
                        <FolderOpen className="w-10 h-10 text-blue-500" />
                      ) : (
                        <Folder className="w-10 h-10 text-blue-500" />
                      )}
                      <span className="text-lg whitespace-normal break-words max-w-[40ch] flex flex-row">
                        {map.name}
                        <div className="flex gap-2 mt-1 pl-2">
                          <Badge className="bg-amber-600/20 text-amber-500 border border-amber-600/50 text-xs">
                            Eigenaar
                          </Badge>
                          {map.public && (
                            <Badge className="bg-green-600/20 text-green-500 border border-green-600/50 text-xs">
                              Openbaar
                            </Badge>
                          )}
                        </div>
                      </span>
                    </div>
                    <div className="flex-grow"></div>
                    <div className="flex items-center pr-2">
                      <span className="text-sm text-neutral-400">
                        {map.listCount} {map.listCount === 1 ? "lijst" : "lijsten"}
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 bg-neutral-800 p-4 rounded-lg text-center">
        <p className="text-neutral-400">
          Organiseer je lijsten in mappen voor een betere overzicht.
        </p>
      </div>
    </div>
  );
}