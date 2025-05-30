export const dynamic = "force-dynamic";

import Tabs, { TabItem } from "@/components/Tabs";
import { prisma } from "@/utils/prisma";
import ForumDialog from "./ForumDialog";
import { getUserFromSession } from "@/utils/auth/auth";
import { getPosts } from "./getPosts";
import ForumPostList from "./ForumPostList";
import MarkdownRenderer from "@/components/md";
import { cookies } from "next/headers";

export default async function ForumHome({
  searchParams,
  params,
}: {
  searchParams: Promise<{ page?: string }>;
  params?: { tab?: string[] };
}) {
  const defaultActiveTab =
    params && params.tab && params.tab.length > 0 ? params.tab[0] : "questions";

  const session = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")!.value
  );
  const user = await prisma.user.findFirst({
    where: {
      name: session!.name,
    },
  });

  // Get the user's ID for queries
  const userId = session?.id;
  const userName = session?.name;
  const userRole = session?.role;

  // Initial data fetch for the first tab to be shown
  const initialData = await getPosts(
    defaultActiveTab as "questions" | "my-questions" | "my-answers",
    0,
    20
  );

  // Define tabs for the forum page
  const tabs: TabItem[] = [
    {
      id: "questions",
      label: "Alle vragen",
      content: (
        <ForumPostList
          initialPosts={initialData.posts}
          initialTotal={initialData.total}
          initialUserMapById={initialData.userMapById}
          initialUserMapByName={initialData.userMapByName}
          tab="questions"
          currentUsername={userName ?? null}
          currentUserId={userId ?? null}
          userRole={userRole ?? null}
        />
      ),
    },
    {
      id: "my-questions",
      label: "Mijn vragen",
      content: (
        <ForumPostList
          initialPosts={
            defaultActiveTab === "my-questions" ? initialData.posts : []
          }
          initialTotal={
            defaultActiveTab === "my-questions" ? initialData.total : 0
          }
          initialUserMapById={
            defaultActiveTab === "my-questions" ? initialData.userMapById : {}
          }
          initialUserMapByName={
            defaultActiveTab === "my-questions" ? initialData.userMapByName : {}
          }
          tab="my-questions"
          currentUsername={userName ?? null}
          currentUserId={userId ?? null}
          userRole={userRole ?? null}
        />
      ),
    },
    {
      id: "my-answers",
      label: "Mijn antwoorden",
      content: (
        <ForumPostList
          initialPosts={
            defaultActiveTab === "my-answers" ? initialData.posts : []
          }
          initialTotal={
            defaultActiveTab === "my-answers" ? initialData.total : 0
          }
          initialUserMapById={
            defaultActiveTab === "my-answers" ? initialData.userMapById : {}
          }
          initialUserMapByName={
            defaultActiveTab === "my-answers" ? initialData.userMapByName : {}
          }
          tab="my-answers"
          currentUsername={userName ?? null}
          currentUserId={userId ?? null}
          userRole={userRole ?? null}
        />
      ),
    },
    {
      id: "how-the-forum-works",
      label: "Hoe werkt het forum?",
      content: (
        <MarkdownRenderer
          content={`
## Hoe werkt het forum?

---

Welkom op ons (leer)forum! Hier kun je vragen stellen, antwoorden geven en punten verdienen terwijl je leert en anderen helpt, of gewoon chatten.

### 🔍 Zoeken naar antwoorden

Voordat je een nieuwe vraag stelt, gebruik de zoekbalk om te kijken of jouw vraag al eerder is beantwoord.<br />
Dit bespaart tijd en helpt om dubbele vragen te voorkomen.

### ❓ Vragen stellen

Heb je een vraag? Plaats deze in de juiste categorie en wees zo duidelijk mogelijk.<br />
Hoe specifieker je vraag, hoe sneller en beter de antwoorden zullen zijn!

Bij het stellen van een vraag kun je labels toevoegen om aan te geven of je vraag over school gaat of niet.<br />
Zo kunnen anderen makkelijker de juiste vragen vinden.

### 💬 Antwoorden geven

Help anderen door antwoorden te geven op vragen.<br />
Zorg ervoor dat je uitleg helder en behulpzaam is.

⭐ Punten verdienen
Je verdient punten door actief bij te dragen:
✅ Een goedgekeurd antwoord geven: +50 punten (nog niet geïmplementeerd)
👍 Een upvote ontvangen op jouw antwoord of post: +1 punt
👎 Een downvote ontvanegn op jouw antwoord of post: -1 punt
❓ Een vraag stellen: +0 punten
🗣️ Antwoord geven op een vraag: +10 punten

Met punten verdien je prestaties die je als titel in kan stellen onder je naam (nog niet geïmplementeerd)! En het ziet er gewoon cool uit.

### 🚨 Moderatie

Alleen vragen die ongepast, spam of beledigend zijn, worden verwijderd.

In tegenstelling tot StudyGo mag je hier dus ook vragen stellen die niet over school gaan, en er zullen geen tutors zijn die alles verwijderen!

Meerdere keren een verwijderde post kan leiden tot een (permanente) verbanning. Dit kan ook meteen gebeuren als je iets heel ongepast zegt.
---

Veel leerplezier! 🚀
    `}
        ></MarkdownRenderer>
      ),
    },
  ];

  let banned = false;
  if (!user!.forumAllowed) {
    banned = true;
  }

  // Determine the base route dynamically
  let baseRoute = "/home/forum";

  // If we have a tab in the params, we're already at a subroute
  if (params?.tab && params.tab.length > 0) {
    // We're in a route like /home/forum/[tab] - the base path is everything before the tab
    baseRoute = "/home/forum";
  }

  return (
    <>
      <div className="py-6 pl-6">
        <div className="flex items-center">
          <h1 className="text-4xl font-extrabold mb-4">Forum</h1>
          <div className="flex-grow"></div>
          <ForumDialog
            banned={banned}
            banreason={user?.forumBanReason}
            banEnd={user?.forumBanEnd}
          />
          <div className="w-4" />
        </div>
        <Tabs
          tabs={tabs}
          defaultActiveTab={defaultActiveTab}
          withRoutes={true}
          baseRoute={baseRoute}
        />
      </div>
    </>
  );
}
