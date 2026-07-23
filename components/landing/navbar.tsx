"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function getRoleDestination(role: string): string {
  if (role === "superuser") return "/superuser";
  if (role === "admin") return "/admin";
  if (role === "empresa") return "/empresa";
  if (role === "auditoria") return "/auditoria";
  if (role === "contralor") return "/controller";
  if (role === "admincc") return "/admincc";
  if (role === "soporte") return "/soporte";
  return "/dashboard";
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, _hasHydrated } = useAuth();
  const router = useRouter();

  const isLoggedIn = _hasHydrated && isAuthenticated && !!user;

  const handlePrimaryAction = () => {
    if (isLoggedIn) {
      router.push(getRoleDestination(user!.role));
    } else {
      scrollToSection("hero-login");
    }
    setOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl 2xl:max-w-400 min-[2000px]:max-w-none items-center justify-between px-4 lg:px-8">
        <a href="/" className="flex items-center">
          <Image
            src="/logo-reservas-corporativas.png"
            alt="ReservasCorp"
            width={190}
            height={60}
            className="object-contain hover:scale-102 transition-transform"
            priority
          />
        </a>

        <div className="hidden md:flex items-center gap-4">
          <Button
            className="rounded-full bg-secondary-pullman hover:bg-secondary-pullman/90 text-white px-5 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => scrollToSection("contacto")}
          >
            Solicitar información
          </Button>

          <div className="border-l border-border pl-6 ml-2">
            <Image
              src="/logo-wit-dark.png"
              alt="WIT Logo"
              width={45}
              height={45}
              className="object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
          aria-label="Abrir menú"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-border px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            <div className="mt-3 flex flex-col gap-2">
              <Button
                className="rounded-full bg-primary-pullman hover:bg-primary-pullman/90 text-white px-5 cursor-pointer w-full"
                onClick={handlePrimaryAction}
              >
                {isLoggedIn ? "Ingresar a la plataforma" : "Iniciar sesión"}
              </Button>
              <Button
                className="rounded-full bg-secondary-pullman hover:bg-secondary-pullman/90 text-white w-full"
                onClick={() => {
                  scrollToSection("contacto");
                  setOpen(false);
                }}
              >
                Solicitar información
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
