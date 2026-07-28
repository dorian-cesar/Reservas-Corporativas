"use client";

import { ArrowUpRight } from "lucide-react";

const plans = [
  {
    name: "STARTER",
    subtitle: "Pymes",
    discount: "5% OFF",
    cupo: "$1M",
    features: [
      "Desde $1.000.000",
      "Descuento 5% pizarra",
      "Vigencia 12 meses",
      "Soporte estándar",
    ],
    highlighted: false,
  },
  {
    name: "GROWTH",
    subtitle: "Empresas medianas",
    discount: "10% OFF",
    cupo: "$5M",
    features: [
      "Desde $5.000.000",
      "Descuento 10% pizarra",
      "Vigencia 12 meses",
      "Soporte prioritario",
    ],
    highlighted: false,
  },
  {
    name: "ENTERPRISE I",
    subtitle: "Grandes cuentas",
    discount: "15% OFF",
    cupo: "$10M",
    features: [
      "Desde $10.000.000",
      "Descuento 15% pizarra",
      "Vigencia 12 meses",
      "Ejecutivo dedicado",
    ],
    highlighted: true,
  },
  {
    name: "ENTERPRISE II",
    subtitle: "Faenas",
    discount: "20% OFF",
    cupo: "$20M",
    features: [
      "Desde $20.000.000",
      "Descuento 20% pizarra",
      "Vigencia 12 meses",
      "SLA y reportes custom",
    ],
    highlighted: false,
  },
];

export function Plans() {
  const handleQuoteClick = (planName: string) => {
    const contactSection = document.getElementById("contacto");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        const textarea = document.getElementById(
          "mensaje",
        ) as HTMLTextAreaElement;
        if (textarea) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value",
          )?.set;
          nativeInputValueSetter?.call(
            textarea,
            `Hola, quiero cotizar el plan ${planName}.`,
          );
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }, 500);
    }
  };

  return (
    <section className="py-20 px-4 lg:px-8 bg-background border-t border-border">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <span className="inline-block rounded-full bg-orange-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600 mb-4">
            Planes Disponibles
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance mb-4">
            Elige tu tramo y empieza a ahorrar
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            A mayor cupo, mayor descuento. Saldo con vigencia 12 meses,
            nominativo y sin saldo negativo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl bg-card p-8 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                plan.highlighted
                  ? "border-2 border-primary-pullman shadow-lg"
                  : "border border-border shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-max">
                  <span className="bg-foreground text-background text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Más Elegido
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-foreground font-medium">
                    {plan.subtitle}
                  </p>
                </div>
                <span className="bg-orange-50/80 text-orange-500 text-xs font-semibold px-3 py-1 rounded-full border border-orange-100">
                  {plan.discount}
                </span>
              </div>

              <div className="mb-6 pb-6 border-b border-border/60 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  {plan.cupo}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  cupo
                </span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleQuoteClick(plan.name)}
                className={`w-full py-3 px-4 rounded-xl cursor-pointer font-semibold text-sm transition flex items-center justify-center gap-2 ${
                  plan.highlighted
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-background border border-border text-foreground hover:bg-muted"
                }`}
              >
                Cotizar Plan
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
