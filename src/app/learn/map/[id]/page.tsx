import { prisma } from "@/utils/prisma";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: { id: Promise<string> } }) {
  const id = await params.id;
  const map = await prisma.map.findUnique({ where: { id } })
  if (!map) {
    return <div>Map niet gevonden</div>;
  }
  if (!map.public) {
    return redirect("/home/start")
  }
  
  return (
    <>
    </>
  )
}