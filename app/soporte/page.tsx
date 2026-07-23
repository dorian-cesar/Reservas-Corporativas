"use client";

import { AuthGuard } from "@/components/auth-guard";
import { SuperReclamos } from "@/components/super-components/super-reclamos";

export default function SoportePage() {
  return (
    <AuthGuard allowedRoles={["soporte", "superuser"]}>
      <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent/5">
        <main className="container mx-auto px-4 py-8">
          <SuperReclamos />
        </main>
      </div>
    </AuthGuard>
  );
}
