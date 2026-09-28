import AuthForm from "@/components/auth/auth-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Solicita un enlace para recuperar tu contraseña.",
};

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot-password" />;
}
