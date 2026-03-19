import {
  Tag,
  CalendarCheck,
  BarChart3,
  HeadphonesIcon,
  Globe,
  CreditCard,
} from "lucide-react";

const benefits = [
  {
    icon: Tag,
    title: "Descuentos exclusivos",
    description:
      "Hasta un 30% de descuento en todos los pasajes para colaboradores de empresas con convenio activo.",
  },
  {
    icon: CalendarCheck,
    title: "Reservas prioritarias",
    description:
      "Accede a asientos reservados y bloques de cupos asegurados en rutas de alta demanda.",
  },
  {
    icon: BarChart3,
    title: "Reportes en tiempo real",
    description:
      "Panel de control con historial de viajes, gastos por área y reportes descargables para tu contabilidad.",
  },
  {
    icon: HeadphonesIcon,
    title: "Ejecutivo dedicado",
    description:
      "Cada empresa convenio cuenta con un ejecutivo de cuenta exclusivo disponible vía teléfono y email.",
  },
  {
    icon: Globe,
    title: "Cobertura nacional",
    description:
      "Más de 200 destinos en todo Chile, desde Arica hasta Punta Arenas, con salidas diarias.",
  },
  {
    icon: CreditCard,
    title: "Facturación centralizada",
    description:
      "Factura mensual consolidada para tu empresa. Simplifica la gestión administrativa de viajes.",
  },
];

const stats = [
  { value: "+500", label: "Empresas convenio" },
  { value: "200+", label: "Destinos en Chile" },
  { value: "30%", label: "Descuento promedio" },
  { value: "15 años", label: "De experiencia" },
];

export function Benefits() {
  return (
    <>
      {/* Stats bar */}
      <section className="bg-primary py-10 px-4 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/20">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center px-4">
                <p className="text-3xl md:text-4xl font-bold text-white">{value}</p>
                <p className="mt-1 text-sm text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section
        id="beneficios"
        className="py-20 px-4 lg:px-8 bg-background"
      >
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
              Características principales
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              Todo lo que tu empresa necesita para gestionar viajes
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Plataforma diseñada para simplificar la gestión de viajes corporativos y maximizar control presupuestario.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-7 hover:border-secondary/30 hover:shadow-lg transition-all duration-200"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 group-hover:bg-secondary/15 transition-colors">
                  <Icon className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="como-funciona"
        className="py-20 px-4 lg:px-8 bg-muted/40"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14 max-w-xl mx-auto">
            <span className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
              Proceso simple
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              Cómo funciona
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-border" />

            {[
              {
                step: "01",
                title: "Contacta con nuestro equipo",
                desc: "Completa el formulario de contacto y un ejecutivo te llamará para entender las necesidades de tu empresa.",
              },
              {
                step: "02",
                title: "Configura tu portal",
                desc: "Establecemos las condiciones y acceso. Tu equipo recibe credenciales en menos de 48 horas.",
              },
              {
                step: "03",
                title: "Comienza a reservar",
                desc: "Accede al portal, gestiona reservas y controla tu presupuesto desde el primer día.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/10 border border-secondary/20 shadow-sm">
                  <span className="text-2xl font-bold text-secondary">{step}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logos / companies section */}
      <section id="empresas" className="py-14 px-4 lg:px-8 bg-background border-y border-border">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground mb-8 font-medium uppercase tracking-widest">
            Empresas que confían en nosotros
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-50 grayscale">
            {["Codelco", "Falabella", "BCI", "Entel", "Sodimac", "Latam"].map((name) => (
              <span key={name} className="text-lg font-bold text-foreground tracking-tight">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
