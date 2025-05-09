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
                        className="bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg p-4 flex flex-col items-center justify-center h-20"
                    >
                        <div className="text-2xl mb-2 font-extrabold flex-row flex items-center">
                            <Image
                                src={getSubjectIcon(subject)}
                                alt={`${subject} icon`}
                                width={40}
                                height={40}
                                className="mr-2"
                            />
                            {getSubjectName(subject)}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}