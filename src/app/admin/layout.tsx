import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPendingArtistSubmissions, getPendingFilmSubmissions, getContactMessages } from "@/db/queries";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const [filmSubmissions, artistSubmissions, messages] = await Promise.all([
    getPendingFilmSubmissions(),
    getPendingArtistSubmissions(),
    getContactMessages(),
  ]);
  const demandesCount = filmSubmissions.length + artistSubmissions.length;
  const messagesCount = messages.filter((m) => m.status === "open").length;

  return (
    <AdminShell demandesCount={demandesCount} messagesCount={messagesCount}>
      {children}
    </AdminShell>
  );
}
