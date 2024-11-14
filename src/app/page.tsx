import './home.css';
import Image from "next/image";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <div
                className="block md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black text-white text-center p-4">
                <div className="flex flex-col items-center">
                    <p className="text-6xl">⚠️</p>
                    <br/>
                    <p className="text-xl">PolarLearn kan niet gebruikt worden op mobiele apparaten of op kleine schermen.</p>
                </div>
            </div>
            <div className="hidden md:flex flex-col min-h-screen">

                <div className="relative -mt-44 z-10 flex-grow h-screen flex items-center justify-center">
                    <section
                        className="w-full bg-neutral-800 pt-8 pb-8 drop-shadow-xl drop-down font-[family-name:var(--font-geist-sans)]">
                        <h1 className="text-center text-7xl font-extrabold leading-tight bg-gradient-to-r from-sky-400 to-sky-100 bg-clip-text text-transparent drop-down">
                            PolarLearn
                        </h1>
                        <br/>
                        <h1 className="flex flex-col sm:flex-row justify-center text-center text-6xl font-extrabold leading-tight bg-clip-text drop-down">
                            Omdat
                            <div className="self-center mx-4 my-4 sm:my-0">
                                <Image
                                    priority
                                    src="https://www-media.studygo.com/wp-content/uploads/2023/07/StudyGo-logo.svg"
                                    alt="StudyGo"
                                    width="145"
                                    height="46"
                                />
                            </div>
                            zo pay-to-win is.
                        </h1>
                    </section>
                </div>
            </div>
        </div>
    );
}
