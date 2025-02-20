import Button1 from '@/components/button/Button1';
import './home.css';
import ReviewCard from '@/components/misc/reviewCard';
import Marquee from '@/components/misc/Marquee';
import Image from 'next/image';
// Subject images //

import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/english.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';
import ckv_img from '@/app/img/ckv.svg';

export default function Home() {
    return (
        <div className="flex flex-col">
            <div className="hidden md:flex flex-col">
                <div className="relative flex">
                    <section
                        className="w-screen h-[calc(100vh-4rem)] bg-neutral-800 pt-8 pb-8 drop-shadow-xl drop-down">
                        <div className='flex flex-row h-full'>
                            <div className="flex flex-col justify-center">
                                <div className="flex ml-20">
                                    <h1 className="text-center text-6xl font-bold leading-tight bg-gradient-to-r to-sky-100 from-sky-500 bg-clip-text text-transparent drop-down">
                                        PolarLearn
                                    </h1>
                                </div>
                                <br />
                                <br />
                                <div className='w-1/2 items-center justify-center'>
                                    <h1 className="text-center  mt-6 flex-col sm:flex-row  text-4xl font-bold leading-tight bg-clip-text drop-down">
                                        De gratis en Open-Source leerprogramma voor al je schoolvakken
                                        <br />
                                    </h1>
                                    <br />
                                    <div className='justify-center flex'>
                                        <Button1 text="Meer weten" />
                                    </div>
                                </div>
                            </div>
                            <div className="ml-auto pr-5 flex items-center">
                                <h1>Hier komt een plaatje te staan...</h1>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <hr className="flex-grow border-neutral-600 m-3" />
            <Marquee direction='right'>
                <div
                    className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"
                >
                    <span className="flex items-center">
                        <Image src={nl_img} alt={"nederlands plaatje"} width={20} height={20} />
                        <div className="w-2" />
                        Nederlands
                    </span>
                </div>
                <div className='w-4' />
                <div
                    className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"
                >
                    <span className="flex items-center">
                        <Image src={de_img} alt={"duits plaatje"} width={20} height={20} />
                        <div className="w-2" />
                        Duits
                    </span>
                </div>
                <div className='w-4' />
                <div
                    className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"
                >
                    <span className="flex items-center">
                        <Image src={fr_img} alt={"frans plaatje"} width={20} height={20} />
                        <div className="w-2" />
                        Frans
                    </span>
                </div>
                <div className='w-4' />
                <div
                    className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"
                >
                    <span className="flex items-center">
                        <Image src={eng_img} alt={"engels plaatje"} width={20} height={20} />
                        <div className="w-2" />
                        Engels
                    </span>
                </div>
                <div className='w-4' />
                <div
                    className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"
                >
                    <span className="flex items-center">
                        <Image src={math_img} alt={"wiskunde plaatje"} width={20} height={20} />
                        <div className="w-2" />
                        Wiskunde
                    </span>
                </div>
                <div className='w-4' />
                <div
                    className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14 text-center place-items-center grid"
                >
                    <span className="flex items-center">
                        <Image src={nsk_img} alt={"nask plaatje"} width={20} height={20} />
                        <div className="w-2" />
                        NaSk
                    </span>
                </div>
                <div className='w-4' />
                <div
                    className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-40 h-14 text-center place-items-center grid"
                >
                    <span className="flex items-center">
                        <Image src={ak_img} alt={"aardrijkskunde plaatje"} width={20} height={20} />
                        <div className="w-2" />
                        Aardrijkskunde
                    </span>
                </div>
                <div className='w-4' />
                <div
                    className="tile bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-40 h-14 text-center place-items-center grid"
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
                <div className='h-4' />
                <Marquee direction='left'>
                    <div className='flex flex-row gap-x-4 w-min'>
                        <ReviewCard stars={5} author='andrei1010' comment='Door de gratis forum en de samenvattingen heb ik eindelijk topcijfers voor geschiedenis!' />
                        <ReviewCard stars={4.7} author='EGaming200' comment='PolarLearn heeft mij geholpen met leren voor toetsen' />
                        <ReviewCard stars={5} author='mrapfelstrudel' comment='Door PolarLearn heb ik eindelijk goede cijfers voor frans!' />
                        <ReviewCard stars={0} author='StudyGo Admin' comment='waarom bestaat dit' />
                        <ReviewCard stars={5} author='anoniem' comment='Ik merk dat PolarLearn veeel sneller is dan StudyGo, ook heel fijn dat het gratis is' />
                        <ReviewCard stars={5} author='kabab33' comment='Ik had een StudyGo abonnement, maar nu niet meer! Bedankt voor mijn € 143,88 per jaar besparen PolarLearn!' />
                        <ReviewCard stars={5} author='luna' comment="Mijn cijfers waren eerst heel slecht, maar sinds ik PolarLearn gebruik zijn ze super hoog!" />
                    </div>
                </Marquee>
            </div>
            <hr className="flex-grow border-neutral-600 m-3" />
            <div className='h-full'>
                <div className='w-full h-64 flex'>
                    <div className='w-1/2'>
                        Lorem Ipsum
                    </div>
                    <div className='border-r border-neutral-600 h-full'></div>
                    <div className='w-1/2 pl-5'>
                        <p className='justify-center flex font-bold text-3xl'>
                            Wat is PolarLearn?
                        </p>
                        <p className='text-xl'>
                            Lorem Ipsum
                        </p>
                    </div>
                </div>
            </div>
            <hr className="flex-grow border-neutral-600 m-3" />
        </div>
    );
}
