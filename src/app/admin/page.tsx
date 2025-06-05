import { redirect } from "next/navigation";

// This page now simply redirects to the default tab, as the layout handles the UI.
export default async function AdminPageRedirect() {
    redirect("/admin/gebruikers");
}