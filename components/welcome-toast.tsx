"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function WelcomeToast() {
  useEffect(() => {
    // En pantallas pequeñas el toast molesta, así que no se muestra
    if (window.innerHeight < 650) return;
    if (!document.cookie.includes("welcome-toast=2")) {
      toast("¡Bienvenido a Animemerchan! 🛍️", {
        id: "welcome-toast",
        duration: Infinity,
        onDismiss: () => {
          document.cookie = "welcome-toast=2; max-age=31536000; path=/";
        },
        description:
          "Merchandising de anime y manga importado de Japón, con envío rastreable y devolución en 30 días.",
      });
    }
  }, []);

  return null;
}
