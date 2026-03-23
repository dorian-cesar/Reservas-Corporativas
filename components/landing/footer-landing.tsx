"use client";

import {
  ArrowUp,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";
import Image from "next/image";

const links = [
  { label: "Conoce tus derechos", href: "/conoce-tus-derechos" },
  { label: "Políticas de privacidad", href: "/politicas-de-privacidad" },
  { label: "Términos y condiciones", href: "/terminos-y-condiciones" },
];

const social = [
  {
    label: "Instagram",
    href: "#",
    icon: Instagram,
  },
  {
    label: "Facebook",
    href: "#",
    icon: Facebook,
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: Linkedin,
  },
];

export function FooterLanding() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border bg-secondary-pullman px-4 py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Logo + tagline + social */}
          <div className="flex flex-col gap-5 md:col-span-1">
            <a href="/" className="flex items-center">
              <Image
                src="/logo-reservas-corporativas-blanco.png"
                alt="ReservasCorp"
                width={160}
                height={40}
                className="h-auto w-auto max-h-15"
                priority
              />
            </a>
            <p className="text-white/50 text-sm leading-relaxed">
              La plataforma integral de Pullman Bus para gestionar viajes y
              reservas corporativas con facilidad.
            </p>
            {/* Social inline bajo el logo */}
            <div className="flex items-center gap-4">
              {social.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:scale-105 transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Spacer vacío en md para empujar las 3 columnas a la derecha */}
          <div className="hidden md:block" />

          {/* Contacto */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-white/70 text-sm">
                <Phone className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                <span>
                  <span className="block text-white/40 text-xs mb-0.5">
                    Soporte ventas online
                  </span>
                  +56 2 3304 8632
                </span>
              </li>
              <li className="flex items-start gap-2 text-white/70 text-sm">
                <Mail className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                <span>
                  <span className="block text-white/40 text-xs mb-0.5">
                    Otras consultas
                  </span>
                  <a
                    href="mailto:clientes@pullmanbus.cl"
                    className="hover:text-white transition-colors"
                  >
                    clientes@pullmanbus.cl
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2 text-white/70 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                <span>
                  <span className="block text-white/40 text-xs mb-0.5">
                    Casa matriz
                  </span>
                  San Borja 235, Estación Central, Santiago
                </span>
              </li>
            </ul>
          </div>

          {/* Información */}
          {/* <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Información
            </h3>
            <ul className="space-y-2">
              {links.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-white/70 text-sm hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div> */}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Portal de Reservas Corporativas de
            Pullman Bus. Todos los derechos reservados.
          </p>
          <p className="text-white/40 text-sm">
            Desarrollado por{" "}
            <a
              href="https://wit.la"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-primary transition-colors hover:underline"
            >
              WIT.la
            </a>
          </p>
        </div>
      </div>

      {/* WhatsApp FAB */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent("Hola, me gustaría información sobre el portal de reservas corporativas de Pullman Bus.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-20 w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 z-50"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.118 1.529 5.847L.057 23.571a.75.75 0 00.921.921l5.724-1.472A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.964-1.361l-.356-.211-3.695.949.969-3.595-.231-.369A9.718 9.718 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
        </svg>
      </a>

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary-pullman text-secondary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 z-50"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
}
