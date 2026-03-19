"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAuthHydration } from "@/lib/auth";

export default function PortalPage() {
  const router = useRouter();
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const hydrated = useAuthHydration();

  useEffect(() => {
    if (!hydrated) return;

    if (isAuthenticated) {
      const currentUser = useAuth.getState().user;
      const role = currentUser?.role ?? "user";

      if (role === "superuser") router.push("/superuser");
      else if (role === "admin") router.push("/admin");
      else if (role === "empresa") router.push("/empresa");
      else if (role === "auditoria") router.push("/auditoria");
      else if (role === "contralor") router.push("/controller");
      else router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
