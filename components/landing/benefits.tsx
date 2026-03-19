import {
  Building2,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  Clock,
  Eye,
  ClipboardList,
  Zap,
  Mail,
  Receipt,
  CheckCircle,
  Sparkles,
} from "lucide-react";

const benefitsForCompany = [
  {
    icon: FileText,
    title: "Consolidación",
    description:
      "Recibe una única factura mensual con el detalle de todos los viajes.",
  },
  {
    icon: BarChart3,
    title: "Control",
    description:
      "Supervisa los gastos por centro de costos y optimiza tu presupuesto.",
  },
  {
    icon: Clock,
    title: "Eficiencia",
    description: "Reduce la carga administrativa y el manejo de efectivo.",
  },
];

const benefitsForAdmin = [
  {
    icon: Users,
    title: "Autonomía",
    description:
      "Gestiona usuarios y permisos según las necesidades de tu equipo.",
  },
  {
    icon: Eye,
    title: "Visibilidad",
    description: "Controla y visualiza el consumo de pasajes en tiempo real.",
  },
  {
    icon: ClipboardList,
    title: "Reportes",
    description: "Accede a informes detallados para un seguimiento preciso.",
  },
];

const benefitsForColaborators = [
  {
    icon: Zap,
    title: "Simplicidad",
    description:
      "Reservan sus pasajes en segundos, sin necesidad de dinero propio.",
  },
  {
    icon: Mail,
    title: "Comodidad",
    description: "Reciben la confirmación inmediata en su correo.",
  },
  {
    icon: Receipt,
    title: "Cero Reembolsos",
    description: "Sin guardar boletas y pedir devoluciones.",
  },
];

const steps = [
  {
    step: "01",
    title: "Activación",
    desc: "Validamos el RUT de tu empresa y activamos tu cuenta corriente corporativa para que empieces a operar.",
  },
  {
    step: "02",
    title: "Reserva",
    desc: "Tus colaboradores autorizados reservan sus pasajes en toda la red Pullmanbus, eligiendo origen, destino y horario.",
  },
  {
    step: "03",
    title: "Facturación",
    desc: "Al final del período, recibes un informe consolidado con el detalle de todos los viajes, listo para facturar.",
  },
];

export function Benefits() {
  return (
    <>
      {/* Benefits section */}
      <section id="beneficios" className="py-20 px-4 lg:px-8 bg-background">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
              Una plataforma, múltiples beneficios
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              Diseñamos una herramienta que simplifica la logística y la
              burocracia de los viajes de negocios
            </h2>
          </div>

          {/* Benefits grid by category */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Para la Empresa */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Para la Empresa
                </h3>
              </div>
              <div className="space-y-5">
                {benefitsForCompany.map(
                  ({ icon: Icon, title, description }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                        <Icon className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Para el Administrador */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Para el Administrador
                </h3>
              </div>
              <div className="space-y-5">
                {benefitsForAdmin.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                      <Icon className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Para los Colaboradores */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Para los Colaboradores
                </h3>
              </div>
              <div className="space-y-5">
                {benefitsForColaborators.map(
                  ({ icon: Icon, title, description }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                        <Icon className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is section */}
      <section className="py-20 px-4 lg:px-8 bg-background border-t border-border">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
                Quiénes somos
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance mb-6">
                ¿Qué es Reservas Corporativas?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Es el portal de autogestión diseñado para optimizar la logística
                terrestre de tu organización. Conectamos directamente con los
                servicios de Pullmanbus, permitiendo que tus colaboradores
                viajen por todo Chile sin necesidad de reembolsos ni pagos en
                efectivo, utilizando una línea de crédito corporativa única.
              </p>
              <div className="space-y-3">
                {[
                  "Reservar pasajes en segundos, de forma autónoma",
                  "Confirmación inmediata por correo electrónico",
                  "Una sola factura mensual consolidada",
                  "Control total de consumos en tiempo real",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl bg-linear-to-br from-primary-pullman/5 to-secondary-pullman/5 border border-border p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-pullman/10">
                    <Sparkles className="w-6 h-6 text-primary-pullman" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      ¿Para qué sirve?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Elimina la fricción administrativa
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Diseñamos esta herramienta para eliminar la fricción
                  administrativa de los viajes de negocios. Tu equipo reserva
                  pasajes sin usar dinero propio, el administrador controla
                  consumos en tiempo real, y la empresa recibe una sola factura
                  mensual consolidada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
