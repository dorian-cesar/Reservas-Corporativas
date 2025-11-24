"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useAuthHydration } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()
  const isAuthenticated = useAuth((s) => s.isAuthenticated)
  const hydrated = useAuthHydration()

  useEffect(() => {
    if (!hydrated) return; // esperar a que cargue

    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [hydrated, isAuthenticated, router])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return null

}
