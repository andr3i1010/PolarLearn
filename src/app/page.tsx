import './home.css';
import Image from "next/image";

export default function Home() {
    return (
        <div
            className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]"
        >
            <section className="items-center py-24 w-screen -mx-8 sm:-mx-20 h-fit">
                <div className="w-full bg-neutral-800 pt-8 pb-8 px-8 mt-20 drop-shadow-xl fade-in drop-down">
                    <h1 className="text-center text-7xl font-extrabold leading-tight bg-gradient-to-r from-sky-400 to-sky-100 bg-clip-text text-transparent fade-in drop-down pl-text fade-in drop-down">
                        PolarLearn
                    </h1>
                    <br/>
                    <h1 className="flex justify-center text-center text-6xl font-extrabold leading-tight bg-clip-text fade-in drop-down">
                        Omdat <div className="self-center ml-4 mr-4"><Image priority src="https://www-media.studygo.com/wp-content/uploads/2023/07/StudyGo-logo.svg" alt="StudyGo" width="145" height="46"/></div> zo pay-to-win is.
                    </h1>
                </div>
            </section>
        </div>
    );
}