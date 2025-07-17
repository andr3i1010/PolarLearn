import Link from "next/link";
import Jdenticon from "@/components/Jdenticon";
import { Badge } from "@/components/ui/badge";

interface Group {
    groupId: string;
    name: string;
    description: string | null;
    members: string[] | any;
    listsAdded: string[] | any;
    creator: string;
    admins?: string[] | any;
    image?: string | null;
}

interface GroupsTabContentProps {
    groups: Group[];
    user: {
        id: string;
        name: string | null;
    };
    isOwnProfile: boolean;
}

export default function GroupsTabContent({
    groups,
    user,
    isOwnProfile
}: GroupsTabContentProps) {
    return (
        <div className="mt-4">
            {groups.length === 0 ? (
                <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
                    {isOwnProfile ? "Je bent nog geen lid van een groep" : "Gebruiker is niet in een groep"}
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map((group) => (
                        <div key={group.groupId}>
                            <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                                <Link href={`/learn/group/${group.groupId}`} className="flex-1 flex items-center">
                                    <div className="flex items-center gap-3">
                                        {group.image ? (
                                            <img
                                                src={group.image}
                                                alt={`Groepsfoto van ${group.name}`}
                                                className="w-10 h-10 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <Jdenticon value={group.name} size={40} />
                                        )}
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
        </div>
    );
}
