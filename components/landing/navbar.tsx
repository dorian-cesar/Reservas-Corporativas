"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Beneficios", href: "beneficios" },
  { label: "Cómo funciona", href: "como-funciona" },
  { label: "Empresas", href: "empresas" },
  { label: "Contacto", href: "contacto" },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary tracking-tight">
              Reservas<span className="text-foreground">Corp</span>
            </span>
          </a>

          {/* <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav> */}

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/portal"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Iniciar sesión
            </a>
            <Button
              className="rounded-full bg-primary hover:opacity-90 text-white px-5"
              onClick={() => scrollToSection("contacto")}
            >
              Solicitar información
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
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => {
                  scrollToSection(link.href);
                  setOpen(false);
                }}
                className="py-2.5 px-3 text-sm font-medium rounded-lg text-left text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <a
                href="/portal"
                className="py-2.5 px-3 text-sm font-medium text-center rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                Iniciar sesión
              </a>
              <Button
                className="rounded-full bg-primary hover:opacity-90 text-white"
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
