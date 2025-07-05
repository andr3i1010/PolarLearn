import Link from "next/link";
import { getSubjectIcon, getSubjectName, subjectEmojiMap } from "@/components/icons";
import Image from "next/image";

export default async function Page() {
    // Get all available subjects from the subjectEmojiMap
    const subjects = Object.keys(subjectEmojiMap);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-extrabold mb-8">Alle Vakken</h1>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {subjects.map((subject) => (
                    <Link
                        key={subject}
                        href={`/learn/subject/${subject}`}
                        className="bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg p-4 flex flex-col items-center justify-center min-h-20"
                    >
                        <div className="text-md font-extrabold flex flex-row items-center text-center gap-2 w-full">
                            <Image
                                src={getSubjectIcon(subject)}
                                alt={`${subject} icon`}
                                width={32}
                                height={32}
                                className="flex-shrink-0"
                            />
                            <span className="break-words leading-tight w-full px-1">{getSubjectName(subject)}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}