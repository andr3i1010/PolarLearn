import Tabs, { TabItem } from '@/components/Tabs';
import { prisma } from '@/utils/prisma';
import ForumDialog from './ForumDialog';
import Image from 'next/image';
import Link from 'next/link';
import Jdenticon from '@/components/Jdenticon';
import { formatRelativeTime } from '@/utils/formatRelativeTime';

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
  "DU": de_img, // Note: ForumDialog uses "DE" but we're using "DU" here
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

export default async function ForumHome() {
  const forumPosts = await prisma.forum.findMany({
    where: {
      type: "thread"
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  // Get unique creator IDs from forum posts
  const creatorIds = [...new Set(forumPosts.map(post => post.creator))];
  
  // Fetch all users in one query
  const users = await prisma.user.findMany({
    where: {
      id: { in: creatorIds }
    },
    select: {
      id: true,
      name: true,
      image: true
    }
  });

  // Create a map for quick lookup
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, { id: string, name: string | null, image: string | null }>);

  const tabs: TabItem[] = [
    {
      id: 'alle',
      label: 'Alle vragen',
      content: forumPosts.length > 0 ? (
        <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden">
          {forumPosts.map((post, index) => {
            const user = userMap[post.creator];
            const subjectIcon = subjectIconMap[post.subject];
            const subjectLabel = subjectLabelMap[post.subject] || post.subject;
            const relativeTime = formatRelativeTime(post.createdAt);
            
            return (
              <Link 
                key={post.post_id}
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
                    </div>
                    <h3 className="font-medium text-lg">{post.title}</h3>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div>
          Er zijn nog geen forumposts onder deze categorie.
        </div>
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
      label: 'Hoe werkt de forum?',
      content: <div>Content for Hoe werkt de forum?</div>
    }
  ];

  return (
    <>
      <div className="py-6 pl-6">
        <div className='flex items-center'>
          <h1 className="text-4xl font-extrabold mb-4">
            Forum
          </h1>
          <div className="flex-grow"></div>
          <ForumDialog />
          <div className='w-4'/>
        </div>
        <Tabs tabs={tabs} defaultActiveTab="alle" />
      </div>
    </>
  );
}