"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TravelProvider } from "@/components/context/travel-context";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideLayout =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/unauthorized" ||
    pathname === "/verify-otp" ||
    pathname.startsWith("/change-password");

  return (
    <TravelProvider>
      <div className="min-h-screen flex flex-col">
        {!hideLayout && <Header />}
        <main className="flex-1 bg-blue-50 min-h-screen">{children}</main>
        {!hideLayout && <Footer />}
      </div>
    </TravelProvider>
  );
}
