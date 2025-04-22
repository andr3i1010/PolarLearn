import { prisma } from "@/utils/prisma";
import * as jdenticon from "jdenticon";
import Tabs, { TabItem } from "@/components/Tabs";
import Image from "next/image";
import Link from "next/link";
import Button1 from "@/components/button/Button1";
import CreatorLink from "@/components/links/CreatorLink";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { PencilIcon } from "lucide-react";
import DeleteListButton from "@/components/learning/DeleteListButton";

import construction from "@/app/img/construction.gif";

import { getSubjectIcon, getSubjectName } from "@/components/icons";
// Add an interface for list data structure
interface ListData {
  created_lists?: string[] | null;
  // Add other properties as needed
}

// Update PracticeList interface to include data for word count
interface PracticeList {
  list_id: string;
  name: string;
  subject: string;
  createdAt: Date;
  published: boolean;
  data: any[];
  creator: string;
}

interface PageProps {
  params: Promise<{
    name: string;
    selectedTab?: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  // Await the Promise to get the actual params
  const { name, selectedTab } = await params;

  // Get current user for checking if they own the lists
  const currentUser = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );
  const currentUserName = currentUser?.name;

  const user = await prisma.user.findFirst({
    where: {
      name: name,
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 space-y-6">
        <h1 className="text-5xl font-bold text-red-600">☹️ Oeps!</h1>
        <p className="mt-2 text-2xl">De opgegeven gebruiker is niet gevonden</p>
        <Button1 text={"Terug naar leren"} redirectTo={"/home/start"} />
      </div>
    );
  }

  // Safely access list data with optional chaining and type casting
  const listdata = user?.list_data as ListData | undefined;

  // Fetch only published lists created by this user
  const rawLists = await prisma.practice.findMany({
    where: {
      creator: user.name as string,
      published: true, // Only show published lists
    },
    select: {
      list_id: true,
      name: true,
      subject: true,
      createdAt: true,
      published: true,
      data: true,
      creator: true,
    },
    orderBy: {
      createdAt: "desc", // Sort by newest first
    },
  });

  const createdLists: PracticeList[] = rawLists.map((list) => ({
    ...list,
    data: Array.isArray(list.data) ? list.data : []
  }));

  // Generate Identicon SVG as fallback
  const svg = jdenticon.toSvg(user?.name || "default", 100);

  // Define tabs for this specific page
  const tabs: TabItem[] = [
    {
      id: "lists",
      label: "Gemaakte lijsten",
      content: (
        <div className="mt-4">
          {createdLists.length > 0 ? (
            <div className="space-y-4">
              {createdLists.map((list) => (
                <div key={list.list_id}>
                  <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                    <Link
                      href={`/learn/viewlist/${list.list_id}`}
                      className="flex-1 flex items-center"
                    >
                      <div className="flex items-center">
                        {list.subject && (
                          <Image
                            src={getSubjectIcon(list.subject) || ""}
                            alt={`${getSubjectName(list.subject)} icon`}
                            width={24}
                            height={24}
                            className="mr-2"
                          />
                        )}
                        <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                          {list.name}
                        </span>
                      </div>
                      <div className="flex-grow"></div>
                      <div className="flex items-center pr-2">
                        {Array.isArray(list.data) && list.data.length === 1
                          ? "1 woord"
                          : `${Array.isArray(list.data) ? list.data.length : 0
                          } woorden`}
                      </div>
                    </Link>

                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                      <CreatorLink creator={list.creator} />
                    </div>

                    {/* Action buttons for list owner */}
                    {(list.creator === currentUserName || currentUser?.role === "admin") && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/learn/editlist/${list.list_id}`}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                          title="Lijst bewerken"
                        >
                          <PencilIcon className="h-5 w-5 text-white" />
                        </Link>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                          <DeleteListButton
                            listId={list.list_id}
                            isCreator={list.creator === currentUserName || currentUser?.role === "admin"}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
              Geen lijsten gevonden
            </div>
          )}
        </div>
      ),
    },
    {
      id: "groups",
      label: "Groepen",
      content: (
        <div>
          {/* Groups content will go here */}
          <Image
            src={construction}
            alt="under construction!"
            width={500}
            height={100}
          />
        </div>
      ),
    },
    {
      id: "achievements",
      label: "Prestaties",
      content: (
        <div>
          {/* Achievements content will go here */}
          <Image
            src={construction}
            alt="under construction!"
            width={500}
            height={100}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="pt-4">
      <div className="space-x-5 flex flex-row items-center pl-2">
        {user?.image ? (
          <Image
            src={user.image}
            alt={`${user.name}'s Avatar`}
            width={100}
            height={100}
            className="rounded-full"
          />
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: svg,
            }}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              overflow: "hidden",
            }}
          />
        )}
        <h1 className="text-2xl font-bold">{user?.name}</h1>
      </div>
      <div className="h-4" />
      <div className="pl-4">
        <Tabs
          tabs={tabs}
          defaultActiveTab={selectedTab || "lists"}
          withRoutes={true}
          baseRoute={`/home/viewuser/${name}`} // Use params.name directly since we know it exists
        />
      </div>
      <div className="h-4" />
    </div>
  );
}
