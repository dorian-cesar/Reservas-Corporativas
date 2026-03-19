"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/hero-bus.jpg"
          alt="Bus Pullman en carretera chilena"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-background to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 lg:px-8 py-32 md:py-40 w-full">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Portal de reservas corporativas
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight text-balance">
            Reservas corporativas{" "}
            <span className="text-white/70">simplificadas y controladas</span>
          </h1>

          <p className="mt-5 text-lg text-white/80 leading-relaxed max-w-xl">
            Plataforma integral para gestionar viajes y reservas de tu empresa.
            Control presupuestario, reportes en tiempo real y beneficios
            exclusivos en un solo lugar.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-8 gap-2"
              onClick={() => scrollToSection("contacto")}
            >
              Solicitar información
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              asChild
              size="lg"
              className="rounded-full bg-secondary-pullman hover:bg-secondary-pullman/90 text-white font-semibold px-8"
            >
              <a href="/portal">Acceder al portal</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
