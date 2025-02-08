import Button1 from '@/components/button/Button1';
import './home.css';
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
                                <br/>
                                <br/>
                                <div className='w-1/2 items-center justify-center'>
                                    <h1 className="text-center  mt-6 flex-col sm:flex-row  text-4xl font-bold leading-tight bg-clip-text drop-down">
                                        De gratis en Open-Source leerprogramma voor al je schoolvakken
                                        <br/>
                                    </h1>
                                    <br/>
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
