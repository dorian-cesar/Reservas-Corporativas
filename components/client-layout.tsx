"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TravelProvider } from "@/components/context/travel-context";
import { BookingSummary } from "@/components/booking-summary";
import { useState, useEffect } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideLayout =
    pathname === "/login" ||
    pathname === "/unauthorized" ||
    pathname === "/verify-otp";

  return (
    <TravelProvider>
      <div className="min-h-screen flex flex-col">
        {!hideLayout && <Header />}
        <main className="flex-1 bg-blue-50">{children}</main>
        {!hideLayout && <Footer />}

        {/* <BookingSummary open={showSummary} onOpenChange={setShowSummary} />
        {hasBookings && !hideLayout && !showSummary && (
          <button
            onClick={() => setShowSummary(true)}
            className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg z-40 flex items-center gap-2 animate-bounce"
          >
            <span className="hidden sm:inline">Ver mis reservas</span>
            <span className="sm:hidden">Reservas</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {
                JSON.parse(localStorage.getItem("completedBookings") || "[]")
                  .length
              }
            </span>
          </button>
        )} */}
      </div>
    </TravelProvider>
  );
}
