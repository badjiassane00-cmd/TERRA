import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Connexion — TERRA" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
