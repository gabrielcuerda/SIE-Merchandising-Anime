import WishlistList from "@/components/wishlist/wishlist-list";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n/lang";
import { translate } from "@/lib/i18n/dict";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: translate(lang, "wishlist.metaTitle"),
    description: translate(lang, "wishlist.metaDescription"),
  };
}

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
