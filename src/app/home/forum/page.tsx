import Tabs, { TabItem } from '@/components/Tabs';
import { prisma } from '@/utils/prisma';
import ForumDialog from './ForumDialog';
import Image from 'next/image';
import Link from 'next/link';
import Jdenticon from '@/components/Jdenticon';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { auth } from "@/utils/auth";
import DeletePostButton from "@/components/DeletePostButton";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'; // Import rehype-raw for processing raw HTML

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Import the subject icons
import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/english.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';
import gs_img from '@/app/img/history.svg';
import bi_img from '@/app/img/bio.svg';

// Create a map for subject icons
const subjectIconMap: Record<string, any> = {
  "WI": math_img,
  "NSK": nsk_img,
  "NE": nl_img,
  "EN": eng_img,
  "FR": fr_img,
  "DU": de_img, // Note: ForumDialog uses "DE" but we're using "DU" here  // waarom?
  "AK": ak_img,
  "GS": gs_img,
  "BI": bi_img,
};

// Subject labels
const subjectLabelMap: Record<string, string> = {
  "AK": "Aardrijkskunde",
  "BI": "Biologie",
  "DU": "Duits",
  "EN": "Engels",
  "FR": "Frans",
  "GS": "Geschiedenis",
  "NA": "Natuurkunde",
  "NSK": "NaSk",
  "NE": "Nederlands",
  "SK": "Scheikunde",
  "WI": "Wiskunde"
};

export default async function ForumHome({
  searchParams
}: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth()
  const user = await prisma.user.findFirst({
    where: {
      name: session!.user.name as string
    }
  })
  const params = await searchParams;
  const page = parseInt(params.page as string) || 1;
  const take = 20;
  const skip = (page - 1) * take;

  // Fetch current page posts and total count concurrently
  const [forumPosts, totalPosts] = await Promise.all([
    prisma.forum.findMany({
      where: { type: "thread" },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.forum.count({
      where: { type: "thread" }
    })
  ]);

  const totalPages = Math.ceil(totalPosts / take);

  const currentUsername = session?.user?.name || null;

  // Get unique creator IDs from forum posts
  const creatorIds = [...new Set(forumPosts.map(post => post.creator))];

  // Also try to fetch users by name in case creator contains usernames
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: { in: creatorIds } },
        { name: { in: creatorIds } }
      ]
    },
    select: {
      id: true,
      name: true,
      image: true
    }
  });

  // Create maps for both ID and name lookups
  const userMapById = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, any>);

  const userMapByName = users.reduce((acc, user) => {
    if (user.name) acc[user.name] = user;
    return acc;
  }, {} as Record<string, any>);

  const tabs: TabItem[] = [
    {
      id: 'alle',
      label: 'Alle vragen',
      content: (
        <>
          <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden">
            {forumPosts.map((post) => {
              const user = userMapById[post.creator] || userMapByName[post.creator];
              const subjectIcon = subjectIconMap[post.subject];
              const subjectLabel = subjectLabelMap[post.subject] || post.subject;
              const relativeTime = formatRelativeTime(post.createdAt);


              // Check if current user is the creator - with more flexibility
              const isPostCreator = currentUsername === post.creator ||
                (user?.name && currentUsername === user.name);

              return (
                <div key={post.post_id} className="relative">
                  <Link
                    href={`/home/forum/${post.post_id}`}
                    className="block"
                  >
                    <div
                      className={`border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all flex items-center cursor-pointer`}
                    >
                      <div className="mr-4 flex-shrink-0">
                        {user?.image ? (
                          <Image
                            src={user.image}
                            alt={`de profielfoto van ${user.name || 'iemand'}`}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <Jdenticon
                            value={user?.name || post.creator}
                            size={40}
                          />
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="text-xs text-gray-400 mb-1 flex items-center">
                          {subjectIcon && (
                            <Image
                              src={subjectIcon}
                              alt={subjectLabel}
                              width={16}
                              height={16}
                              className="mr-1"
                            />
                          )}
                          <span>{subjectLabel}</span>
                          <span className="mx-1.5">•</span>
                          <span className="text-gray-500">{relativeTime}</span>
                          <span className="mx-1.5">•</span>
                          <span className="text-gray-500">Door: {user?.name || post.creator}</span>
                        </div>
                        <h3 className="font-medium text-lg">{post.title}</h3>
                      </div>
                    </div>
                  </Link>

                  {/* Position the delete button absolutely to not interfere with the link */}
                  {isPostCreator && (
                    <div className="absolute top-4 right-4 z-10">
                      <DeletePostButton
                        postId={post.post_id}
                        isCreator={true}
                        isMainPost={true}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationPrevious>
                  {page > 1 ? (
                    <Link href={`?page=${page - 1}`}>Vorige</Link>
                  ) : (
                    <span className="text-gray-400">Vorige</span>
                  )}
                </PaginationPrevious>
                {/* Render page numbers */}
                <PaginationContent>
                  {
                    Array.from({ length: totalPages }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink href={`?page=${pageNum}`} isActive={pageNum === page}>
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })
                  }
                </PaginationContent>
                <PaginationNext>
                  {page === totalPages ? (
                    <span className="text-gray-400">Volgende</span>
                  ) : (
                    <Link href={`?page=${page + 1}`}>Volgende</Link>
                  )}
                </PaginationNext>
              </Pagination>
            </div>
          )}
        </>
      )
    },
    {
      id: 'mijn',
      label: 'Mijn vragen',
      content: <div>Content for Mijn vragen</div>
    },
    {
      id: 'antwoorden',
      label: 'Mijn antwoorden',
      content: <div>Content for Mijn antwoorden</div>
    },
    {
      id: 'hoe',
      label: 'Hoe werkt het forum?',
      content: (
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-3xl font-bold mb-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-2" {...props} />,
            img: ({ src, alt, ...props }) => (
              <img
                src={src}
                alt={alt || ""}
                style={{ maxWidth: "100%", maxHeight: "400px", height: "auto" }}
                {...props}
              />
            ),
          }}
          rehypePlugins={[rehypeRaw]} // Enable raw HTML processing
        >
          {`
## Hoe werkt het forum?

Welkom op ons leerforum! Hier kun je vragen stellen, antwoorden geven en punten verdienen terwijl je leert en anderen helpt.

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

### ⭐ Punten verdienen

Je verdient punten door actief bij te dragen:<br />
✅ Een goedgekeurd antwoord geven: +X punten<br />
👍 Een upvote ontvangen op jouw antwoord: +X punten<br />
❓ Een vraag stellen: +X punten<br />

Met punten verdien je prestaties die je als titel in kan stellen onder je naam!<br />
En het ziet er gewoon cool uit.

### 🚨 Moderatie

Alleen vragen die choquerend, spam of beledigend zijn, worden verwijderd.<br />
In tegenstelling tot StudyGo mag je hier dus ook vragen stellen die niet over school gaan!

---

Veel leerplezier! 🚀
    `}
        </ReactMarkdown>
      ),
    }
  ];
  let banned = false
  if (!user!.forumAllowed || !user!.loginAllowed) {
    // return {
    //   success: false,
    //   error: `Je bent ${user!.forumBanEnd ? `tot ${user!.forumBanEnd}` : 'permanent'} verbannen van PolarLearn's forums. Reden:`
    // };
    banned = true
  }
  return (
    <>
      <div className="py-6 pl-6">
        <div className='flex items-center'>
          <h1 className="text-4xl font-extrabold mb-4">
            Forum
          </h1>
          <div className="flex-grow"></div>
          <ForumDialog
            banned={banned}
            banreason={user?.forumBanReason}
            banEnd={user?.forumBanEnd}  // pass new banEnd prop
          />
          <div className='w-4' />
        </div>
        <Tabs tabs={tabs} defaultActiveTab="alle" />
      </div>
    </>
  );
}
