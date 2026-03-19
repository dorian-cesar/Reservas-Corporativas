"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary tracking-tight">
              Reservas<span className="text-foreground">Corp</span>
            </span>
          </a>

          <div className="hidden md:flex items-center gap-3">
            <Button
              className="rounded-full bg-secondary-pullman hover:bg-secondary-pullman/90 text-white px-5 cursor-pointer"
              onClick={() => scrollToSection("contacto")}
            >
              Solicitar información
            </Button>
            <Button
              className="rounded-full bg-primary-pullman hover:bg-primary-pullman/90 text-white px-5 cursor-pointer"
              onClick={() => (window.location.href = "/portal")}
            >
              Iniciar sesión
            </Button>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
            aria-label="Abrir menú"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-b border-border px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            <div className="mt-3 flex flex-col gap-2">
              <Button
                className="rounded-full bg-primary-pullman hover:bg-primary-pullman/90 text-white px-5 cursor-pointer"
                onClick={() => (window.location.href = "/portal")}
              >
                Iniciar sesión
              </Button>
              <Button
                className="rounded-full bg-secondary-pullman hover:bg-secondary-pullman/90 text-white"
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
