import AuthForm from "@/components/auth/auth-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de SIE Merchandising.",
};

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    confirmed?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedNext = params.next;
  const nextPath =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/account";

  return (
    <AuthForm
      mode="login"
      nextPath={nextPath}
      initialMessage={
        params.confirmed
          ? "Cuenta confirmada. Ya puedes iniciar sesión."
          : undefined
      }
      initialError={
        params.error === "auth_callback_error"
          ? "No hemos podido confirmar tu sesión. Inténtalo de nuevo."
          : undefined
      }
    />
  );
}
