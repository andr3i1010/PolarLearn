import AdminNavWrapper from "./AdminNavWrapper";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { prisma } from "@/utils/prisma";
import Image from "next/image";
import Link from "next/link";
import Button1 from "@/components/button/Button1";

export default async function AdminLayout({
    children,
    params: paramsPromise, // Renamed to indicate it's a Promise
}: {
    children: React.ReactNode;
    params: Promise<{ tab?: string[] }>; // Changed to Promise type
}) {
    const params = await paramsPromise; // Resolve the Promise
    const defaultActiveTab =
        params?.tab && params.tab.length > 0
            ? params.tab[0]
            : "algemeen";

    const sessionCookie = (await cookies()).get("polarlearn.session-id");
    const session = sessionCookie ? await getUserFromSession(sessionCookie.value) : null;

    if (session?.role !== "admin" || !session) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <Image
                    src={require("@/app/admin/ga_weg.png")}
                    alt="aardige man"
                    width={300}
                    height={300}
                    className="mb-4"
                />
                <h1 className="text-4xl font-extrabold mb-4">ga weg</h1>
                <p>Hoe ben je hier gekomen?</p>
                <Link href="/home/start">
                    <Button1 text="Terug naar home" />
                </Link>
            </div>
        );
    }

    return (
        <div className="py-6 pl-6">
            <div className="flex items-center">
                <h1 className="text-4xl font-extrabold mb-4">admin</h1>
                <div className="flex-grow"></div>
                <div className="w-4" />
            </div>
            <AdminNavWrapper
                defaultActiveTab={defaultActiveTab}
            />
            <div className="mt-4">
                {children}
            </div>
        </div>
    );
}
