import { prisma } from "@/utils/prisma";
import { CreateGroupButton } from "./clientComponents";
import Link from "next/link";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import Jdenticon from "@/components/Jdenticon";
import { Badge } from "@/components/ui/badge";

export const metadata = {
    title: "Groepen",
    description: "Je groepen",
};

export default async function GroupsPage() {
    const user = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    if (!user) {
        return <div>Je moet ingelogd zijn om groepen te zien.</div>;
    }

    // Get user's data including owned and joined groups
    const userData = await prisma.user.findUnique({
        where: { id: user.id }
    });

    // Get IDs of groups the user is in
    const userOwnGroups = (userData?.ownGroups as string[]) || [];
    const userInGroups = (userData?.inGroups as string[]) || [];

    // Combine and deduplicate group IDs
    const allUserGroupIds = [...new Set([...userOwnGroups, ...userInGroups])];

    // Fetch all groups the user is a member of
    const userGroups = await prisma.group.findMany({
        where: {
            OR: [
                { groupId: { in: allUserGroupIds } },
                { creator: user.id }
            ]
        },
        orderBy: { updatedAt: 'desc' }
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold">Groepen</h1>
                <CreateGroupButton />
            </div>

            <section>
                <h2 className="text-2xl font-bold mb-4">Mijn Groepen</h2>
                {userGroups.length === 0 ? (
                    <div className="bg-neutral-800 text-neutral-400 rounded-lg p-6 text-center">
                        <p>Je bent nog geen lid van een groep. Maak er zelf een aan of zoek bestaande groepen via de zoekfunctie.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {userGroups.map((group) => (
                            <div key={group.groupId}>
                                <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                                    <Link href={`/learn/group/${group.groupId}`} className="flex-1 flex items-center">
                                        <div className="flex items-center gap-3">
                                            <Jdenticon value={group.name} size={40} />
                                            <span className="text-lg whitespace-normal break-words max-w-[40ch] flex flex-row">
                                                {group.name}
                                                <div className="flex gap-2 mt-1 pl-2">
                                                    {group.creator === user.id && (
                                                        <Badge className="bg-amber-600/20 text-amber-500 border border-amber-600/50 text-xs">
                                                            Eigenaar
                                                        </Badge>
                                                    )}
                                                    {Array.isArray(group.admins) && group.admins.includes(user.id) && group.creator !== user.id && (
                                                        <Badge className="bg-blue-600/20 text-blue-500 border border-blue-600/50 text-xs">
                                                            Beheerder
                                                        </Badge>
                                                    )}
                                                </div>
                                            </span>
                                        </div>
                                        <div className="flex-grow"></div>
                                        <div className="flex items-center pr-2">
                                            <span className="text-sm text-neutral-400">
                                                {Array.isArray(group.members) ? group.members.length : 0} {Array.isArray(group.members) && group.members.length === 1 ? "lid" : "leden"} •
                                                {Array.isArray(group.listsAdded) ? group.listsAdded.length : 0} {Array.isArray(group.listsAdded) && group.listsAdded.length === 1 ? "lijst" : "lijsten"}
                                            </span>
                                        </div>
                                    </Link>

                                    {group.description && (
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[150px] text-center">
                                            <p className="text-sm text-neutral-400 line-clamp-1">{group.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="mt-8 bg-neutral-800 p-4 rounded-lg text-center">
                <p className="text-neutral-400">
                    Zoek naar andere groepen via de zoekbalk bovenin.
                </p>
            </div>
        </div>
    );
}