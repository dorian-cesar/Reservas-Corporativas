"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { FooterLanding } from "@/components/landing/footer-landing";
import { TravelProvider } from "@/components/context/travel-context";
import { Toaster } from "@/components/ui/toaster";

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
        {!hideLayout && <FooterLanding />}
      </div>
      <Toaster />
    </TravelProvider>
  );
}
