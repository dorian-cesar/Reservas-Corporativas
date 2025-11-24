"use client";

import { AuthGuard } from "@/components/auth-guard";
import { TravelSearch } from "@/components/travel-search";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <TravelSearch />
    </AuthGuard>
  );
}
