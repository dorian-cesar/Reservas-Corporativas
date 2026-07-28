import {
  XCircle,
  Wallet,
  Percent,
  Shield,
  Calendar,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

const aspects = [
  {
    id: "flujo",
    icon: Wallet,
    title: "Flujo de Caja",
    tradicional: "Facturación / Crédito a 30-60 días",
    prepago: "Abono anticipado e inmediato. Factura por anticipo",
    highlightPrepago: false
  },
  {
    id: "tarifas",
    icon: Percent,
    title: "Tarifas",
    tradicional: "Estándar por volumen posterior",
    prepago: "Cupo bonificado por tramo: 5% / 10% / 15% / 20% sobre valor pizarra",
    highlightPrepago: false
  },
  {
    id: "riesgo",
    icon: Shield,
    title: "Riesgo",
    tradicional: "Requiere análisis financiero y comité de crédito",
    prepago: "Sin evaluación de riesgo. Sin análisis financiero, sin riesgo, sin cobranza",
    highlightPrepago: true
  },
  {
    id: "vigencia",
    icon: Calendar,
    title: "Vigencia y Devolución",
    tradicional: "Línea de crédito abierta",
    prepago: "Vigencia 12 meses, sin devolución, sin saldo negativo. Anulaciones vuelven al cupo",
    highlightPrepago: false
  }
];

export function ComparativeTable() {
  return (
    <section className="py-20 px-4 lg:px-8 bg-muted/30 border-t border-border">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
            Comparativa de Modelos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance mb-4">
            ¿Postpago o Prepago? Compara y elige
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Misma cobertura, mejor control financiero. El modelo prepago elimina riesgo y acelera tu operación.
          </p>
        </div>

        {/* Mobile View (Cards) */}
        <div className="grid grid-cols-1 gap-6 lg:hidden">
          {aspects.map(aspect => (
            <div key={aspect.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="p-4 bg-muted/30 border-b border-border flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                  <aspect.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">{aspect.title}</h3>
              </div>
              <div className="p-5 space-y-6">
                {/* Tradicional */}
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-2">
                    Modelo Tradicional (CC-DIR / CC-ESP)
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                    <span>{aspect.tradicional}</span>
                  </div>
                </div>
                
                {/* Prepago */}
                <div className="rounded-xl bg-primary-pullman/5 p-4 border border-primary-pullman/10">
                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    <div className="text-xs text-primary-pullman font-semibold">
                      Nuevo Modelo Cupo Prepago
                    </div>
                    <span className="bg-primary-pullman text-white text-[9px] px-2 py-0.5 rounded-full font-bold">RECOMENDADO</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary-pullman shrink-0 mt-0.5" />
                    <span className={`font-medium ${aspect.highlightPrepago ? "text-green-800 dark:text-green-600" : ""}`}>
                      {aspect.prepago}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="p-6 font-semibold text-foreground text-sm uppercase tracking-wider w-1/4 bg-muted/30 border-r border-border">
                  Aspecto
                </th>
                <th className="p-6 font-semibold text-foreground text-sm uppercase tracking-wider w-1/3 bg-muted/30">
                  <div className="text-muted-foreground text-xs mb-1 font-medium">Modelo Tradicional</div>
                  (CC-DIR / CC-ESP)
                </th>
                <th className="p-6 font-semibold text-primary-pullman text-sm uppercase tracking-wider w-5/12 bg-primary-pullman/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">Nuevo Modelo Cupo Prepago</span>
                    <span className="bg-primary-pullman text-white text-[10px] px-2 py-0.5 rounded-full font-bold">RECOMENDADO</span>
                  </div>
                  (CC-PRE)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {aspects.map(aspect => (
                <tr key={aspect.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-6 border-r border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                        <aspect.icon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-foreground">{aspect.title}</span>
                    </div>
                  </td>
                  <td className="p-6 text-muted-foreground text-sm">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                      <span>{aspect.tradicional}</span>
                    </div>
                  </td>
                  <td className="p-6 text-foreground text-sm bg-primary-pullman/5">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-pullman shrink-0 mt-0.5" />
                      <span className={`font-medium ${aspect.highlightPrepago ? "text-green-800 dark:text-green-600" : ""}`}>
                        {aspect.prepago}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-start lg:items-center justify-center gap-3 mt-8 text-sm text-muted-foreground/80 bg-muted/30 p-4 rounded-xl">
          <TrendingUp className="w-5 h-5 shrink-0 text-primary-pullman" />
          <p className="leading-relaxed">
            El cupo prepago no genera saldo negativo. Las anulaciones vuelven automáticamente al cupo disponible. Vigencia 12 meses desde el abono.
          </p>
        </div>
      </div>
    </section>
  );
}
