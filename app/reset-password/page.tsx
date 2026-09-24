import AuthForm from "@/components/auth/auth-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  description: "Crea una nueva contraseña para tu cuenta.",
};

export default function ResetPasswordPage() {
  return <AuthForm mode="reset-password" />;
}
