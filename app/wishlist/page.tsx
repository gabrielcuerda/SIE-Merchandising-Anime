import WishlistList from "@/components/wishlist/wishlist-list";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Lista de deseos",
  description: "Guarda tus productos favoritos.",
};

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/wishlist");
  }

  return (
    <div className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 py-10 lg:px-6">
      <WishlistList userId={user.id} />
    </div>
  );
}
