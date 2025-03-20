export default function ReviewCard({ stars, author, comment, smalltext = false }: { stars: number; author: string; comment: string; smalltext?: boolean }) {
    return (
        <>
            <div className="flex flex-col bg-neutral-800 h-64 w-72 m-auto rounded-lg p-5">
                <h1 className="text-2xl font-bold">
                    {author}
                </h1>
                <div className="flex">
                    {[...Array(5)].map((_, index) => {
                        const starValue = stars - index;
                        if (starValue >= 1) {
                            return <span key={index} className="text-yellow-400 text-2xl">★</span>;
                        } else if (starValue > 0) {
                            const widthPercent = Math.round(starValue * 100);
                            return (
                                <span key={index} className="relative text-2xl">
                                    <span className="text-gray-400">★</span>
                                    <span className="absolute top-0 left-0 overflow-hidden" style={{ width: `${widthPercent}%`, color: "#facc15" }}>
                                        ★
                                    </span>
                                </span>
                            );
                        } else {
                            return <span key={index} className="text-gray-400 text-2xl">★</span>;
                        }
                    })}
                </div>
                <div className="h-4" />
                {smalltext ? (
                    <p className="text-md">
                        {comment}
                    </p>
                ) : (
                    <p className="text-lg">
                        {comment}
                    </p>
                )}
            </div>
        </>
    );
}