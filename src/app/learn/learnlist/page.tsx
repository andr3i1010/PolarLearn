import { prisma } from "@/utils/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default async function LerenPage() {
    const listdata = await prisma.practice.findMany({
        select: {
            list_id: true,
            name: true,
            subject: true,
            data: true,
        },
        orderBy: {
            name: 'asc'
        }
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Leren</h1>
                <p className="text-gray-400">
                    Leer met een combinatie van alle methodes: zelf beoordelen, meerkeuze, hints en open vragen.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {listdata.map((list) => (
                    <Card key={list.list_id} className="bg-neutral-800 border-neutral-700">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">{list.name}</CardTitle>
                            {list.subject && (
                                <p className="text-sm text-gray-400">{list.subject}</p>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">
                                    {Array.isArray(list.data) ? list.data.length : 0} items
                                </span>
                                <Link href={`/learn/leren/${list.list_id}`}>
                                    <Button variant="default" size="sm">
                                        Start Leren
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {listdata.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-lg mb-4">
                        Geen lijsten gevonden.
                    </p>
                    <Link href="/home/start">
                        <Button variant="outline">
                            Terug naar home
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
