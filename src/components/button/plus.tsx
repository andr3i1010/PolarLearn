import Link from "next/link"
export default async function PlusBtn({ redir }: { redir: string }) {
    return (
        <Link href={redir}>
            <div className="bg-neutral-700 w-min h-min rounded-full flex justify-center hover:bg-neutral-600 transition-all">
                <svg
                    width="40px"
                    height="40px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ margin: "auto", display: "block" }}
                >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                        <path
                            d="M6 12H18M12 6V18"
                            stroke="#000000"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></path>
                    </g>
                </svg>
            </div>
        </Link>
    )
}