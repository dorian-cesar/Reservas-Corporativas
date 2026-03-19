import { ArrowRight, Building2, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  { icon: Building2, label: "Cientos de empresas activas" },
  { icon: MapPin, label: "Cobertura nacional de destinos" },
  { icon: Shield, label: "Plataforma 100% segura" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bus.jpg"
          alt="Bus Pullman en carretera chilena"
          className="h-full w-full object-cover object-center"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-background to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 lg:px-8 py-32 md:py-40 w-full">
        <div className="max-w-2xl">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Portal de reservas corporativas
          </span>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight text-balance">
            Reservas corporativas{" "}
            <span className="text-white/70">simplificadas y controladas</span>
          </h1>

          <p className="mt-5 text-lg text-white/80 leading-relaxed max-w-xl">
            Plataforma integral para gestionar viajes y reservas de tu empresa.
            Control presupuestario, reportes en tiempo real y beneficios
            exclusivos en un solo lugar.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold px-8 gap-2"
            >
              <a href="#contacto">
                Solicitar información
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="rounded-full bg-secondary hover:bg-secondary/90 text-white font-semibold px-8"
            >
              <a href="/portal">Acceder al portal</a>
            </Button>
          </div>

          {/* Highlights */}
          <div className="mt-12 flex flex-wrap gap-6">
            {highlights.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-white/80 text-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 border border-white/20">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
