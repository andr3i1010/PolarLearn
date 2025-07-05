import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "PolarLearn | Admin",
    description: "Beheer van alles en nog wat",
}
export default async function AdminPageRedirect() {
    redirect("/admin/algemeen");
}