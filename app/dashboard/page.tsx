"use client";

import { AuthGuard } from "@/components/auth-guard";
import { TravelSearch } from "@/components/travel-search";
import { UserProvider } from "@/components/providers/user-provider";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <UserProvider />
      <TravelSearch />
    </AuthGuard>
  );
}
