"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/user-store";

export function UserProvider() {
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, []);

  return null;
}
