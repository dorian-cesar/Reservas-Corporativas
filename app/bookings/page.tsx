"use client";

import { AuthGuard } from "@/components/auth-guard";
import { MyBookings } from "@/components/my-booking";

export default function BookingsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Mis Reservas
            </h1>
            <p className="text-xl text-muted-foreground">
              Gestiona y revisa todas tus reservas de viajes
            </p>
          </div>
          <MyBookings showActiveOnly={false} showCard={true} />
        </div>
      </div>
    </AuthGuard>
  );
}
