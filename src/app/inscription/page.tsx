import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Créer un compte — SunuNature" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
