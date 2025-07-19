"use client"
import Button1 from '@/components/button/Button1';
import './home.css';
import ReviewCard from '@/components/misc/reviewCard';
import Marquee from '@/components/misc/Marquee';
import Image from 'next/image';

// Magic //
import { motion } from "motion/react"
import {
    Animator,
    ScrollContainer,
    ScrollPage,
    batch,
    Fade,
    Move,
    MoveIn,
    Sticky,
} from "react-scroll-motion";

// Images //
import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/tea_innit.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';
import ckv_img from '@/app/img/ckv.svg';
import logo from '@/app/img/pl-500.svg'; // Added back logo import

import down from '@/app/img/down.svg'; // Added back down import
import shield from '@/app/img/secure-icon-marketing.svg';
import banner from '@/../public/banner.png';

// Butiful //
import FirstMarketingComponent from '@/components/marketing/1';
import SecondMarketingComponent from '@/components/marketing/2';

export default function Home() {
    return (
        <div className='p-0 m-0'>
            {/* ontcomment dit als de db in de brand staat */}
            {/* AI CODE START */}
            {/* <div className="bg-yellow-400 text-yellow-800 p-3 w-full flex justify-center items-center">
                <div className="flex items-center gap-2 max-w-4xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="font-medium">We ervaren momenteel enkele technische problemen. Onze excuses voor het ongemak.</p>
                </div>
            </div> */}

            {/* <div className="bg-yellow-400 text-yellow-800 p-3 w-full flex justify-center items-center">
                <div className="flex items-center gap-2 max-w-4xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="font-medium">Onze nieuwe bevelingssysteem is nog experimenteel, join de discord als je per ongeluk verbannen wordt!</p>
                </div>
            </div> */}
            {/* AI CODE END */}
            <div className="hidden md:flex flex-col">
                <div className="hidden md:flex flex-col">
                    <div className="relative flex">
                        <section
                            className="w-screen h-[calc(100vh-4rem)] bg-neutral-800 pt-8 pb-8 drop-shadow-xl drop-down">
                            <div className='flex flex-row h-full'>
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center pl-10">

                                        <Image
                                            className="ml-4"
                                            src={logo}
                                            alt="PolarLearn Logo"
                                            height={64}
                                            width={64}
                                            style={{ width: '4rem', height: 'auto' }}
                                        />
                                        <h1 className="text-6xl font-bold leading-tight bg-gradient-to-r from-sky-500 to-sky-100 bg-clip-text text-transparent ml-6">
                                            PolarLearn
                                        </h1>
                                    </div>
                                    <br />
                                    <br />
                                    <div className='w-1/2 items-center justify-center'>
                                        <h1 className="text-center mt-6 flex-col sm:flex-row  text-4xl font-bold leading-tight bg-clip-text drop-down">
                                            Het gratis en Open-Source leerprogramma voor al je schoolvakken
                                            <br />
                                        </h1>
                                        <br />
                                        <div className='justify-center flex'>
                                            <Button1 text="Meer weten" onClick={() => { window.scrollTo({ behavior: "smooth", top: 400 }) }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="pr-5 flex items-center absolute right-0 top-0 bottom-0">
                                    <Image
                                        src={banner}
                                        alt={"PolarLearn banner ding"}
                                        width={700}
                                        style={{ maxWidth: '100%', height: 'auto' }}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                <hr className="flex-grow border-neutral-600 m-3" />
                <Marquee direction='right'>
                    <div
                        className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"
                    >
                        <span className="flex items-center">
                            <Image src={nl_img} alt={"nederlands plaatje"} width={20} height={20} />
                            <div className="w-2" />
                            Nederlands
                        </span>
                    </div>
                    <div className='w-4' />
                    <div
                        className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"
                    >
                        <span className="flex items-center">
                            <Image src={de_img} alt={"duits plaatje"} width={20} height={20} />
                            <div className="w-2" />
                            Duits
                        </span>
                    </div>
                    <div className='w-4' />
                    <div
                        className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"
                    >
                        <span className="flex items-center">
                            <Image src={fr_img} alt={"frans plaatje"} width={20} height={20} />
                            <div className="w-2" />
                            Frans
                        </span>
                    </div>
                    <div className='w-4' />
                    <div
                        className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"
                    >
                        <span className="flex items-center">
                            <Image src={eng_img} alt={"engels plaatje"} width={20} height={20} />
                            <div className="w-2" />
                            Engels
                        </span>
                    </div>
                    <div className='w-4' />
                    <div
                        className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"
                    >
                        <span className="flex items-center">
                            <Image src={math_img} alt={"wiskunde plaatje"} width={20} height={20} />
                            <div className="w-2" />
                            Wiskunde
                        </span>
                    </div>
                    <div className='w-4' />
                    <div
                        className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"
                    >
                        <span className="flex items-center">
                            <Image src={nsk_img} alt={"nask plaatje"} width={20} height={20} />
                            <div className="w-2" />
                            NaSk
                        </span>
                    </div>
                    <div className='w-4' />
                    <div
                        className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"
                    >
                        <span className="flex items-center">
                            <Image src={ak_img} alt={"aardrijkskunde plaatje"} width={20} height={20} />
                            <div className="w-2" />
                            Aardrijkskunde
                        </span>
                    </div>
                    <div className='w-4' />
                    <div
                        className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg min-w-36 w-auto h-14 text-center place-items-center grid"
                    >
                        <span className="flex items-center">
                            <Image src={ckv_img} alt={"ckv plaatje"} width={20} height={20} />
                            <div className="w-2" />
                            CKV
                        </span>
                    </div>

                </Marquee>
                <hr className="flex-grow border-neutral-600 m-3" />
                <div className='flex w-full items-center justify-center flex-col'>
                    <h1 className='text-2xl font-bold'>Wat onze fans vinden:</h1>
                    <div className='flex flex-row gap-x-2 items-center'>
                        <h1 className="text-2xl font-bold">4.2</h1>
                        <div className='flex'>
                            {[...Array(5)].map((_, index) => {
                                const starValue = 4.3 - index;
                                if (starValue >= 1) {
                                    return <span key={index} className="text-yellow-400 text-2xl">★</span>;
                                } else if (starValue > 0) {
                                    const widthPercent = Math.round(starValue * 100);
                                    return (
                                        <span key={index} className="relative text-2xl">
                                            <span className="text-gray-400">★</span>
                                            <span className="absolute top-0 left-0 overflow-hidden" style={{ width: `${widthPercent}%`, color: "#facc15" }}>★</span>
                                        </span>
                                    );
                                } else {
                                    return <span key={index} className="text-gray-400 text-2xl">★</span>;
                                }
                            })}
                        </div>
                    </div>
                    <div className='h-4' />
                    <Marquee direction='left'>
                        <div className='flex flex-row gap-x-4 w-min '>
                            <ReviewCard stars={5} author='andrei1010' comment='Door de gratis forum en de samenvattingen heb ik eindelijk topcijfers voor geschiedenis!' />
                            <ReviewCard stars={4.7} author='EGaming200' comment='PolarLearn heeft mij geholpen met leren voor toetsen' />
                            <ReviewCard stars={5} author='MrApfelstrudel' comment='Door PolarLearn heb ik eindelijk goede cijfers voor frans!' />
                            <ReviewCard stars={0} author='StudyGo Admin' comment='waarom bestaat dit' />
                            <ReviewCard stars={5} author='anoniem' comment='Ik merk dat PolarLearn veeel sneller is dan StudyGo, ook heel fijn dat het gratis is' />
                            <ReviewCard stars={5} author='kabab33' comment='Ik had een StudyGo abonnement, maar nu niet meer! Bedankt voor mijn € 95,88 per jaar besparen PolarLearn!' />
                            <ReviewCard stars={5} author='luna' comment="Mijn cijfers waren eerst heel slecht, maar sinds ik PolarLearn gebruik zijn ze super hoog!" />
                            <ReviewCard stars={2.5} author='waterliefhebber' comment="Te weinig water" />
                            <ReviewCard stars={5} author='-Mohammed-' comment="Het forum is echt veel beter en fijner! Ik hoop dat iedereen naar PolarLearn gaat! Bij StudyGo haalde ik vijfen en vieren, maar nu ik PolarLearn gebruik, haal ik achten en negenen!" smalltext={true} />
                            <ReviewCard stars={5} author='klokmeister' comment='De beste leerprogramma van ze allemaal' />
                        </div>
                    </Marquee>
                </div>
                <hr className="flex-grow border-neutral-600 m-3" />

                <div className='h-60' />

                {/* ✨ Scoll magie ✨ */}
                <div className="my-12">
                    <ScrollContainer>
                        <ScrollPage>
                            <Animator animation={batch(Fade(), Move(), Sticky())}>
                                <div className='h-svh flex justify-center items-center flex-col'>
                                    <h1 className='text-4xl font-bold'>Waarom PolarLearn?</h1>
                                    <div className='h-4' />
                                    <div className='flex flex-row gap-x-4'>
                                        <Image src={down} alt="down arrow" width={20} height={20} />
                                        <p>Scroll naar beneden om te zien!</p>
                                        <Image src={down} alt="down arrow" width={20} height={20} />
                                    </div>
                                </div>
                            </Animator>
                        </ScrollPage>
                        <ScrollPage>
                            <Animator animation={batch(Fade())}>
                                <div className='h-svh'>
                                    <div className='w-full h-full flex items-center'>
                                        <div className='w-1/2'>
                                            <FirstMarketingComponent />
                                        </div>
                                        <div className='border-r border-neutral-600 h-full'></div>
                                        <div className='w-1/2 pl-5'>
                                            <motion.p
                                                initial={{ y: -30, opacity: 0 }}
                                                whileInView={{ y: 0, opacity: 1 }}
                                                transition={{ duration: 0.7, delay: 0.4 }}
                                                className='justify-center flex font-bold text-3xl'>
                                                Wat is PolarLearn?
                                            </motion.p>
                                            <div className='h-4' />
                                            <motion.p
                                                initial={{ y: -30, opacity: 0 }}
                                                whileInView={{ y: 0, opacity: 1 }}
                                                transition={{ duration: 0.7, delay: 0.7 }}
                                                className='text-xl'>
                                                PolarLearn is een FOSS (gratis en Open-Source) leerprogramma, voor al je vakken. PolarLearn kan ook gebruikt worden als een alternatief voor het betaalde StudyGo.
                                            </motion.p>
                                        </div>
                                    </div>
                                </div>
                            </Animator>
                        </ScrollPage>
                        <ScrollPage>
                            <Animator animation={batch(MoveIn(1000, 0))}>
                                <div className="h-screen flex flex-row items-center justify-center">
                                    <div className="w-1/2 h-full flex flex-col items-center justify-center pl-5">
                                        <motion.p
                                            initial={{ y: -30, opacity: 0 }}
                                            whileInView={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 0.7, delay: 0.8 }}
                                            className='justify-center flex font-bold text-3xl'>
                                            PolarLearn is snel
                                        </motion.p>
                                        <motion.p
                                            className="mt-4 text-center text-xl"
                                            initial={{ y: -30, opacity: 0 }}
                                            whileInView={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 0.7, delay: 1 }}
                                        >
                                            PolarLearn gebruikt de nieuwste technologieën, zoals Next.js, Prisma (ORM) en onze eigen PolarAuth om jouw leerervaring zo snel mogelijk te maken.
                                        </motion.p>
                                    </div>
                                    <div className="border-r border-neutral-600 h-full"></div>
                                    <div className="w-1/2 h-full flex items-center justify-center">
                                        <motion.div
                                            initial={{ x: 80, opacity: 0 }}
                                            whileInView={{ x: 0, opacity: 1 }}
                                            transition={{ duration: 0.7, delay: 0.8 }}
                                        >
                                            <SecondMarketingComponent />
                                        </motion.div>
                                    </div>
                                </div>
                            </Animator>
                        </ScrollPage>
                        <ScrollPage>
                            <Animator animation={batch(MoveIn(-1000, 0))}>
                                <div className="h-screen flex flex-row items-center justify-center">
                                    <div className="w-1/2 h-full flex flex-col items-center justify-center pl-5">
                                        <motion.p
                                            initial={{ y: -30, opacity: 0 }}
                                            whileInView={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 0.7, delay: 0.8 }}
                                            className='justify-center flex font-bold text-3xl'>
                                            PolarLearn is veilig
                                        </motion.p>
                                        <motion.p
                                            className="mt-4 text-center text-xl"
                                            initial={{ y: -30, opacity: 0 }}
                                            whileInView={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 0.7, delay: 1 }}
                                        >
                                            PolarLearn gebruikt de nieuwste beveiligingstechnologieën, zoals Argon2id <a target='_blank' className='text-sky-400' href='https://www.sentinelone.com/cybersecurity-101/cybersecurity/hashing/'>hashing</a>, salting, en password peppers om jouw gegevens zo veilig mogelijk te houden. Zo kan je met een gerust hart leren. PolarLearn verzamelt en verkoopt je persoonlijke data juist niet, in tegenstelling tot StudyGo.
                                        </motion.p>
                                    </div>
                                    <div className="border-r border-neutral-600 h-full"></div>
                                    <div className="w-1/2 h-full flex items-center justify-center">
                                        <motion.div
                                            initial={{ y: -30, opacity: 0 }}
                                            whileInView={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 0.7, delay: 0.8 }}
                                        >
                                            <Image src={shield} alt="shield" width={400} height={400} />
                                        </motion.div>
                                    </div>
                                </div>
                            </Animator>
                        </ScrollPage>
                    </ScrollContainer>
                </div>
                <div>
                    <div className='flex flex-col items-center justify-center'>
                        <h1 className='text-4xl font-bold'>Wat doe jij nog hier?</h1>
                        <div className='h-8' />
                        <Button1 text='Start met leren!' redirectTo='/home/start' />
                    </div>
                </div>
                <div className='h-8' />
            </div>
            <div className="md:hidden text-center flex flex-col items-center justify-center h-screen">
                <div className="flex items-center">

                    <Image
                        className="ml-4"
                        src={logo}
                        alt="PolarLearn Logo"
                        height={64}
                        width={64}
                        style={{ width: '3rem', height: 'auto' }}
                    />
                    <h1 className="text-5xl font-bold leading-tight bg-gradient-to-r from-sky-500 to-sky-100 bg-clip-text text-transparent ml-6">
                        PolarLearn
                    </h1>
                </div>
                <h1>Polarlearn op kleine scherme is nog in beta, will je doorgaan?</h1>
                <Button1 text='ja!' redirectTo='/home/start' />
            </div>
        </div>
    );
}