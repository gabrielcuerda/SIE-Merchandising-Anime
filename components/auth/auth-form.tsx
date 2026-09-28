"use client";

import { createClient } from "@/lib/supabase/browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const supabase = createClient();

type AuthMode = "login" | "register" | "forgot-password" | "reset-password";

type AuthFormProps = {
  mode: AuthMode;
  nextPath?: string;
  initialMessage?: string;
  initialError?: string;
};

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white";

export default function AuthForm({
  mode,
  nextPath = "/account",
  initialMessage = "",
  initialError = "",
}: AuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  const destination =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/account";

  const title =
    mode === "login"
      ? "Iniciar sesión"
      : mode === "register"
        ? "Crear cuenta"
        : mode === "forgot-password"
          ? "Recuperar contraseña"
          : "Nueva contraseña";

  const description =
    mode === "login"
      ? "Accede a tu cuenta para gestionar tus pedidos."
      : mode === "register"
        ? "Crea una cuenta para comprar merchandising de anime."
        : mode === "forgot-password"
          ? "Te enviaremos un enlace para crear una nueva contraseña."
          : "Introduce una nueva contraseña para tu cuenta.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError("No hemos podido iniciar sesión. Revisa tus datos.");
          return;
        }

        router.push(destination);
        router.refresh();
        return;
      }

      if (mode === "register") {
        if (password.length < 8) {
          setError("La contraseña debe tener al menos 8 caracteres.");
          return;
        }

        if (password !== confirmPassword) {
          setError("Las contraseñas no coinciden.");
          return;
        }

        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_nombre: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
          },
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        if (data.session) {
          router.push(destination);
          router.refresh();
          return;
        }

        setMessage(
          "Te hemos enviado un correo para confirmar tu cuenta. Revisa tu bandeja de entrada.",
        );
        return;
      }

      if (mode === "forgot-password") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
          },
        );

        if (authError) {
          setError(authError.message);
          return;
        }

        setMessage(
          "Si el correo existe, recibirás un enlace para recuperar tu contraseña.",
        );
        return;
      }

      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({ password });

      if (authError) {
        setError(
          "No hemos podido actualizar la contraseña. Solicita un nuevo enlace e inténtalo de nuevo.",
        );
        return;
      }

      setMessage("Contraseña actualizada. Redirigiendo a tu cuenta...");
      window.setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 1000);
    } catch {
      setError("Ha ocurrido un error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm md:p-8 dark:border-neutral-800 dark:bg-black">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <div>
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor="fullName"
              >
                Nombre completo
              </label>
              <input
                id="fullName"
                className={inputClass}
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>
          ) : null}

          {mode !== "reset-password" ? (
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                className={inputClass}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          ) : null}

          {mode !== "forgot-password" ? (
            <div>
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor="password"
              >
                Contraseña
              </label>
              <input
                id="password"
                className={inputClass}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={8}
                required
              />
            </div>
          ) : null}

          {mode === "register" || mode === "reset-password" ? (
            <div>
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor="confirmPassword"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                className={inputClass}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          ) : null}

          {message ? (
            <p
              className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
              role="status"
            >
              {message}
            </p>
          ) : null}

          {error ? (
            <p
              className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Un momento..."
              : mode === "login"
                ? "Iniciar sesión"
                : mode === "register"
                  ? "Crear cuenta"
                  : mode === "forgot-password"
                    ? "Enviar enlace"
                    : "Actualizar contraseña"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          {mode === "login" ? (
            <>
              <Link
                className="hover:text-black dark:hover:text-white"
                href="/forgot-password"
              >
                ¿Has olvidado tu contraseña?
              </Link>
              <span>
                ¿No tienes cuenta?{" "}
                <Link
                  className="text-blue-600 hover:underline"
                  href="/register"
                >
                  Regístrate
                </Link>
              </span>
            </>
          ) : null}

          {mode === "register" ? (
            <span>
              ¿Ya tienes cuenta?{" "}
              <Link className="text-blue-600 hover:underline" href="/login">
                Inicia sesión
              </Link>
            </span>
          ) : null}

          {mode === "forgot-password" || mode === "reset-password" ? (
            <Link className="text-blue-600 hover:underline" href="/login">
              Volver al inicio de sesión
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
