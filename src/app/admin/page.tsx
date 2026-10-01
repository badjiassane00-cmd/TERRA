import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminDashboard from "@/app/admin/AdminDashboard";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Administration — TERRA" };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") redirect("/");
  return <AdminDashboard />;
}