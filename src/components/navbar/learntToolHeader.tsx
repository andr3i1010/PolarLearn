"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { X, ArrowLeft, Check, X as XIcon, Settings } from "lucide-react";
import Link from "next/link";
import Dropdown from "@/components/button/DropdownBtn";
import Image from "next/image";

// Import the images for the learning methods
import learn from "@/app/img/learn.svg";
import test from "@/app/img/test.svg";
import hints from "@/app/img/hint.svg";
import mind from "@/app/img/mind.svg";
import livequiz from "@/app/img/livequiz.svg";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../ui/dialog";

interface LearnToolHeaderProps {
    listId: string;
    progress?: number; // 0-100
    correctAnswers?: number;
    wrongAnswers?: number;
    onMethodChange?: (method: string) => void;
    currentMethod?: string;
}

const LearnToolHeader = ({
    listId,
    progress = 0,
    correctAnswers = 0,
    wrongAnswers = 0,
    onMethodChange,
    currentMethod = "leren",
}: LearnToolHeaderProps) => {
    const router = useRouter();
    const [seconds, setSeconds] = useState(0);

    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format the time as MM:SS
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    };

    // Check if this is a custom learning session
    const isCustomMode = listId.startsWith('custom-');
    const actualListId = isCustomMode ? listId.replace('custom-', '') : listId;

    // Check if this is a combined list (multiple lists selected)
    const isCombinedList = actualListId.startsWith('combined-');

    // Determine the back button URL
    const backButtonUrl = isCombinedList ? '/home/start' : `/learn/viewlist/${actualListId}`;

    // Define the learning methods for the dropdown
    const learningMethods: [React.ReactNode, string][] = [
        [
            <div key="leren" className="flex items-center">
                <Image
                    src={learn}
                    alt="leren plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Leren</span>
            </div>,
            isCustomMode ? `/learn/custom/learn` : `/learn/learnlist/${listId}`,
        ],
        [
            <div key="toets" className="flex items-center">
                <Image
                    src={test}
                    alt="toets plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Toets</span>
            </div>,
            isCustomMode ? `/learn/custom/test` : `/learn/test/${listId}`,
        ],
        [
            <div key="hints" className="flex items-center">
                <Image
                    src={hints}
                    alt="hints plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Hints</span>
            </div>,
            isCustomMode ? `/learn/custom/hints` : `/learn/hints/${listId}`,
        ],
        [
            <div key="gedachten" className="flex items-center">
                <Image
                    src={mind}
                    alt="gedachten plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">In gedachten</span>
            </div>,
            isCustomMode ? `/learn/custom/mind` : `/learn/mind/${listId}`,
        ],
        [
            <div key="multikeuze" className="flex items-center">
                <Image
                    src={livequiz}
                    alt="Multikeuze plaatje"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                <span className="font-medium">Multikeuze</span>
            </div>,
            isCustomMode ? `/learn/custom/multichoice` : `/learn/multichoice/${listId}`,
        ],
    ];

    // Get the current method display name
    const getMethodDisplayText = () => {
        switch (currentMethod) {
            case "toets":
                return "Toets";
            case "hints":
                return "Hints";
            case "gedachten":
                return "In gedachten";
            case "multikeuze":
                return "Meerkeuze";
            default:
                return "Leren";
        }
    };

    return (
        <>
            <div className="w-full bg-neutral-800 p-3 flex items-center justify-between sticky top-0 z-100 border-b border-neutral-700">
                {/* Left side: Method dropdown and back button */}
                <div className="flex items-center gap-3">
                    <Link
                        href={backButtonUrl}
                        className="flex items-center bg-neutral-700 hover:bg-neutral-600 transition-colors px-3 py-1 rounded-md"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span>Terug</span>
                    </Link>

                    <div className="text-white font-mono bg-neutral-700 px-3 py-1 rounded-md">
                        {formatTime(seconds)}
                    </div>
                </div>
                <div className="learn-dropdown hidden md:block w-45 mx-5">
                    <Dropdown
                        text={getMethodDisplayText()}
                        dropdownMatrix={learningMethods}
                        width={180}
                    />
                </div>


                <div className="flex-grow mr-4">
                    <Progress value={progress} className="h-3 [&>div]:bg-sky-400" />
                </div>

                <div className="flex items-center gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <button
                                className="flex items-center justify-center h-8 w-8 bg-neutral-700 hover:bg-neutral-600 transition-colors rounded-full"
                            >
                                <Settings className="h-4 w-4" />
                            </button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle>Leerinstellingen</DialogTitle>
                            <div className="p-4">
                                <p>Bee Movie Script According to all known laws of aviation, there is no way a bee should be able to fly. Its wings are too small to get its fat little body off the ground. The bee, of course, flies anyway because bees don't care what humans think is impossible. Yellow, black. Yellow, black. Yellow, black. Yellow, black. Ooh, black and yellow! Let's shake it up a little. Barry! Breakfast is ready! Ooming! Hang on a second. Hello? - Barry? - Adam? - Oan you believe this is happening? - I can't. I'll pick you up. Looking sharp. Use the stairs. Your father paid good money for those. Sorry. I'm excited. Here's the graduate. We're very proud of you, son. A perfect report card, all B's. Very proud. Ma! I got a thing going here. - You got lint on your fuzz. - Ow! That's me! - Wave to us! We'll be in row 118,000. - Bye! Barry, I told you, stop flying in the house! - Hey, Adam. - Hey, Barry. - Is that fuzz gel? - A little. Special day, graduation. Never thought I'd make it. Three days grade school, three days high school. Those were awkward. Three days college. I'm glad I took a day and hitchhiked around the hive. You did come back different. - Hi, Barry. - Artie, growing a mustache? Looks good. - Hear about Frankie? - Yeah. - You going to the funeral? - No, I'm not going. Everybody knows, sting someone, you die. Don't waste it on a squirrel. Such a hothead. I guess he could have just gotten out of the way. I love this incorporating an amusement park into our day. That's why we don't need vacations. Boy, quite a bit of pomp... under the circumstances. - Well, Adam, today we are men. - We are! - Bee-men. - Amen! Hallelujah! Students, faculty, distinguished bees, please welcome Dean Buzzwell. Welcome, New Hive Oity graduating class of... ...9:15. That concludes our ceremonies. And begins your career at Honex Industries! Will we pick ourjob today? I heard it's just orientation. Heads up! Here we go. Keep your hands and antennas inside the tram at all times. - Wonder what it'll be like? - A little scary. Welcome to Honex, a division of Honesco and a part of the Hexagon Group. This is it! Wow. Wow. We know that you, as a bee, have worked your whole life to get to the point where you can work for your whole life. Honey begins when our valiant Pollen Jocks bring the nectar to the hive. Our top-secret formula is automatically color-corrected, scent-adjusted and bubble-contoured into this soothing sweet syrup with its distinctive golden glow you know as... Honey! - That girl was hot. - She's my cousin! - She is? - Yes, we're all cousins. - Right. You're right. - At Honex, we constantly strive to improve every aspect of bee existence. These bees are stress-testing a new helmet technology. - What do you think he makes? - Not enough. Here we have our latest advancement, the Krelman. - What does that do? - Oatches that little strand of honey that hangs after you pour it. Saves us millions. Oan anyone work on the Krelman? Of course. Most bee jobs are small ones. But bees know that every small job, if it's done well, means a lot. But choose carefully because you'll stay in the job you pick for the rest of your life. The same job the rest of your life? I didn't know that. What's the difference? You'll be happy to know that bees, as a species, haven't had one day off in 27 million years. So you'll just work us to death? We'll sure try. Wow! That blew my mind! "What's the difference?" How can you say that? One job forever? That's an insane choice to have to make. I'm relieved. Now we only have to make one decision in life. But, Adam, how could they never have told us that? Why would you question anything? We're bees. We're the most perfectly functioning society on Earth. You ever think maybe things work a little too well here? Like what? Give me one example. I don't know. But you know what I'm talking about. Please clear the gate. Royal Nectar Force on approach. Wait a second. Oheck it out. - Hey, those are Pollen Jocks! - Wow. I've never seen them this close. They know what it's like outside the hive. Yeah, but some don't come back. - Hey, Jocks! - Hi, Jocks! You guys did great! You're monsters! You're sky freaks! I love it! I love it! - I wonder where they were. - I don't know. Their day's not planned. Outside the hive, flying who knows where, doing who knows what. You can'tjust decide to be a Pollen Jock. You have to be bred for that. Right. Look. That's more pollen than you and I will see in a lifetime. It's just a status symbol. Bees make too much of it. Perhaps. Unless you're wearing it and the ladies see you wearing it. Those ladies? Aren't they our cousins too? Distant. Distant. Look at these two. - Oouple of Hive Harrys. - Let's have fun with them. It must be dangerous being a Pollen Jock. Yeah. Once a bear pinned me against a mushroom! He had a paw on my throat, and with the other, he was slapping me! - Oh, my! - I never thought I'd knock him out. What were you doing during this? Trying to alert the authorities. I can autograph that. A little gusty out there today, wasn't it, comrades? Yeah. Gusty. We're hitting a sunflower patch six miles from here tomorrow. - Six miles, huh? - Barry! A puddle jump for us, but maybe you're not up for it. - Maybe I am. - You are not! We're going 0900 at J-Gate. What do you think, buzzy-boy? Are you bee enough? I might be. It all depends on what 0900 means. Hey, Honex! Dad, you surprised me. You decide what you're interested in? - Well, there's a lot of choices. - But you only get one. Do you ever get bored doing the same job every day? Son, let me tell you about stirring. You grab that stick, and you just move it around, and you stir it around. You get yourself into a rhythm. It's a beautiful thing. You know, Dad, the more I think about it, maybe the honey field just isn't right for me. You were thinking of what, making balloon animals? That's a bad job for a guy with a stinger. Janet, your son's not sure he wants to go into honey! - Barry, you are so funny sometimes. - I'm not trying to be funny. You're not funny! You're going into honey. Our son, the stirrer! - You're gonna be a stirrer? - No one's listening to me! Wait till you see the sticks I have. I could say anything right now. I'm gonna get an ant tattoo! Let's open some honey and celebrate! Maybe I'll pierce my thorax. Shave my antennae. Shack up with a grasshopper. Get a gold tooth and call everybody "dawg"! I'm so proud. - We're starting work today! - Today's the day. Oome on! All the good jobs will be gone. Yeah, right. Pollen counting, stunt bee, pouring, stirrer, front desk, hair removal... - Is it still available? - Hang on. Two left! One of them's yours! Oongratulations! Step to the side. - What'd you get? - Picking crud out. Stellar! Wow! Oouple of newbies? Yes, sir! Our first day! We are ready! Make your choice. - You want to go first? - No, you go. Oh, my. What's available? Restroom attendant's open, not for the reason you think. - Any chance of getting the Krelman? - Sure, you're on. I'm sorry, the Krelman just closed out. Wax monkey's always open. The Krelman opened up again. What happened? A bee died. Makes an opening. See? He's dead. Another dead one. Deady. Deadified. Two more dead. Dead from the neck up. Dead from the neck down. That's life! Oh, this is so hard! Heating, cooling, stunt bee, pourer, stirrer, humming, inspector number seven, lint coordinator, stripe supervisor, mite wrangler. Barry, what do you think I should... Barry? Barry! All right, we've got the sunflower patch in quadrant nine... What happened to you? Where are you? - I'm going out. - Out? Out where? - Out there. - Oh, no! I have to, before I go to work for the rest of my life. You're gonna die! You're crazy! Hello? Another call coming in. If anyone's feeling brave, there's a Korean deli on 83rd that gets their roses today. Hey, guys. - Look at that. - Isn't that the kid we saw yesterday? Hold it, son, flight deck's restricted. It's OK, Lou. We're gonna take him up. Really? Feeling lucky, are you? Sign here, here. Just initial that. - Thank you. - OK. You got a rain advisory today, and as you all know, bees cannot fly in rain. So be careful. As always, watch your brooms, hockey sticks, dogs, birds, bears and bats. Also, I got a couple of reports of root beer being poured on us. Murphy's in a home because of it, babbling like a cicada! - That's awful. - And a reminder for you rookies, bee law number one, absolutely no talking to humans! All right, launch positions! Buzz, buzz, buzz, </p>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center text-green-500 bg-green-900/30 px-2 py-1 rounded-md">
                            <Check className="h-5 w-5 mr-1" />
                            {correctAnswers}
                        </span>
                        <span className="flex items-center text-red-500 bg-red-900/30 px-2 py-1 rounded-md">
                            <XIcon className="h-5 w-5 mr-1" />
                            {wrongAnswers}
                        </span>
                    </div>

                    <Link
                        href="/home/start"
                        className="flex items-center justify-center h-8 w-8 bg-neutral-700 hover:bg-neutral-600 transition-colors rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </Link>
                </div>
            </div>

            <style>{`
        .learn-dropdown > div.absolute {
          position: fixed !important;
          left: 200px !important;
          top: 3px !important;
          z-index: 150;
        }
      `}</style>
        </>
    );
};

export default LearnToolHeader;