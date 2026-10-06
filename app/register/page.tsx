import AuthForm from "@/components/auth/auth-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea una cuenta en Animemerchan.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
