import './shimmer.css'
export default function RecentLoadSkeleton() {
     return (
        <div className="subjects">
            <h1 className="text-4xl pl-5 pt-4 font-extrabold">Recente Vakken:</h1>
            <div className='wrapper'>
                <div className="flex pt-5 pl-5 space-x-4 relative overflow-hidden">
                    <div className="tile-load bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14"></div>
                    <div className="tile-load bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14"></div>
                    <div className="tile-load bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14"></div>
                    <div className="tile-load bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14"></div>
                    <div className="tile-load bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14"></div>
                    <div className="tile-load bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg w-36 h-14"></div>
                </div>
            </div>

            <h1 className="text-4xl pl-5 pt-10 font-extrabold">Recente Oefenlijsten:</h1>

            <div className="lists">
                <div className=" flex flex-col py-6 px-5 space-y-4">
                    <div className="tile-load bg-neutral-800 text-white font-bold py-2 pt-4 rounded-lg h-16"></div>
                    <div className="tile-load bg-neutral-800 text-white font-bold py-2 pt-4 rounded-lg h-16"></div>
                    <div className="tile-load bg-neutral-800 text-white font-bold py-2 pt-4 rounded-lg h-16"></div>
                    <div className="tile-load bg-neutral-800 text-white font-bold py-2 pt-4 rounded-lg h-16"></div>
                </div>  
            </div>
        </div>
    )
}