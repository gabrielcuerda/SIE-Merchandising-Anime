import WishlistList from "@/components/wishlist/wishlist-list";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mis deseos",
  description: "Consulta tus productos favoritos.",
};

export default async function AccountWishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/wishlist");
  }

  return <WishlistList userId={user.id} title="Mis deseos" />;
}
