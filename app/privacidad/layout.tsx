import Footer from "components/layout/footer";
import type { ReactNode } from "react";

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="w-full">
        <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:px-8 sm:py-20">
          {children}
        </div>
      </div>
      <Footer />
    </>
  );
}
