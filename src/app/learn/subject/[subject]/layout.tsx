import { ReactNode } from "react";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import Image from "next/image";
import { getSubjectIcon, getSubjectName } from "@/components/icons";
import Tabs, { TabItem } from "@/components/Tabs";

interface SubjectLayoutProps {
  children: ReactNode;
  params: Promise<{ subject: string; tab?: string[] }>;
}

export default async function SubjectLayout({ children, params }: SubjectLayoutProps) {
  const { subject, tab } = await params;
  const defaultTab = tab && tab.length > 0 ? tab[0] : "practiced-lists";

  // Get subject name and icon
  const subjectName = getSubjectName(subject);
  const subjectIcon = getSubjectIcon(subject);

  // Get current user for checking ownership
  const currentUser = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );

  // Define tabs for this page
  const tabs: TabItem[] = [
    {
      id: "practiced-lists",
      label: "Geoefende Lijsten",
      content: <></>,
    },
    {
      id: "all-lists",
      label: "Alle Lijsten",
      content: <></>,
    },
    ...(currentUser?.id ? [
      {
        id: "my-lists",
        label: "Mijn Lijsten",
        content: <></>,
      }
    ] : []),
    {
      id: "forum",
      label: "Forum",
      content: <></>,
    },
    {
      id: "statistics",
      label: "Statistieken",
      content: <></>,
    },
  ];

  const baseRoute = `/learn/subject/${subject}`;

  return (
    <>
      {/* Header */}
      <div className="pt-4">
        <div className="px-6 flex items-center mb-6">
          <div className="flex items-center">
            {subjectIcon && (
              <div className="mr-4">
                <Image src={subjectIcon} alt={`${subjectName} icon`} width={48} height={48} />
              </div>
            )}
            <h1 className="text-3xl font-bold">{subjectName}</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="pl-4">
          <Tabs
            tabs={tabs}
            defaultActiveTab={defaultTab}
            withRoutes={true}
            baseRoute={baseRoute}
            renderContent={false}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="mt-4">
        {children}
      </div>
    </>
  );
}
