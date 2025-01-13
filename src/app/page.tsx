import Button1 from '@/components/button/Button1';
import './home.css';
import Image from 'next/image';
export default function Home() {
    return (
        <div className="flex flex-col">
            <div className="hidden md:flex flex-col">
                <div className="relative flex">
                    <section
                        className="w-full bg-neutral-800 pt-8 pb-8 drop-shadow-xl drop-down">
                        <div className='flex flex-row'>
                            <div className="flex flex-col">
                                <div className="flex ml-20">
                                    <h1 className="text-center text-5xl font-bold leading-tight bg-gradient-to-r to-sky-100 from-sky-500 bg-clip-text text-transparent drop-down">
                                        PolarLearn
                                    </h1>
                                </div>
                                <br/>
                                <br/>
                                <div className='w-96'>
                                    <h1 className="flex ml-8 mt-6 flex-col sm:flex-row text-center text-3xl font-bold leading-tight bg-clip-text drop-down">
                                        De gratis en Open-Source leerprogramma voor al je schoolvakken
                                        <br/>
                                    </h1>
                                    <br/>
                                    <div className='justify-center flex'>
                                        <Button1 text="Meer weten" />
                                    </div>
                                </div>
                            </div>
                            <div className="ml-auto pr-5">
                                <Image src="https://picsum.photos/400/200" alt="Hero" width={600} height={200} />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <hr className="flex-grow border-neutral-600 m-3" />
            <div className='h-full'>
                <div className='w-full h-64 flex'>
                    <div className='w-1/2'>
                    Lorem Ipsum
                    </div>
                    <div className='border-r border-neutral-600 h-full'></div>
                    <div className='w-1/2 pl-5'>
                        <p className='justify-center flex font-bold text-2xl'>
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
