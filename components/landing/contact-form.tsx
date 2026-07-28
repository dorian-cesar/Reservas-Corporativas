"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle2, AlertCircle, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ContactFormData {
  nombre: string;
  empresa: string;
  rut: string;
  cargo: string;
  email: string;
  telefono: string;
  empleados: string;
  mensaje: string;
}

type FormErrors = Partial<Record<keyof ContactFormData, string>>;

const RANGE_OPTIONS = [
  "1 – 10 empleados",
  "11 – 50 empleados",
  "51 – 200 empleados",
  "201 – 500 empleados",
  "+500 empleados",
];

const CONTACT_INFO = [
  // {
  //   icon: Phone,
  //   label: "Soporte ventas online",
  //   value: "+56 2 3304 8632",
  //   href: "tel:+56233048632",
  // },
  {
    icon: Mail,
    label: "Reservas Corporativas",
    value: "soportecuentascorrientes@pullmanbus.cl",
    href: "mailto:soportecuentascorrientes@pullmanbus.cl",
  },
  {
    icon: MapPin,
    label: "Casa matriz",
    value: "San Borja 235, Estación Central, Santiago",
    href: undefined,
  },
];

const formatRut = (value: string): string => {
  // Limpiar caracteres no permitidos
  const cleaned = value.replace(/[^0-9kK]/g, "");
  if (!cleaned) return "";

  if (cleaned.length <= 1) {
    return cleaned.toUpperCase();
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();

  let formatted = "";
  let i = body.length;
  while (i > 3) {
    formatted = "." + body.slice(i - 3, i) + formatted;
    i -= 3;
  }
  formatted = body.slice(0, i) + formatted;

  return `${formatted}-${dv}`;
};

export function ContactForm() {
  const [form, setForm] = useState<ContactFormData>({
    nombre: "",
    empresa: "",
    rut: "",
    cargo: "",
    email: "",
    telefono: "",
    empleados: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ContactFormData, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateField = (
    field: keyof ContactFormData,
    value: string,
  ): string | undefined => {
    switch (field) {
      case "nombre":
        if (!value.trim()) return "El nombre es requerido";
        if (value.trim().length < 3) return "Mínimo 3 caracteres";
        break;
      case "empresa":
        if (!value.trim()) return "La empresa es requerida";
        break;
      case "email":
        if (!value.trim()) return "El email es requerido";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inválido";
        break;
      case "telefono":
        if (!value.trim()) return "El teléfono es requerido";
        if (!/^[0-9\s+\-()]{8,15}$/.test(value)) return "Teléfono inválido";
        break;
      case "empleados":
        if (!value) return "Selecciona un rango";
        break;
    }
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: keyof ContactFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, form[field]),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const newErrors: FormErrors = {};
    (Object.keys(form) as Array<keyof ContactFormData>).forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(
        Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Error al enviar");
      }

      setSubmitted(true);
    } catch (err: any) {
      setServerError(
        err.message || "Ocurrió un error al enviar el formulario.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id="contacto" className="py-20 px-4 lg:px-8 bg-background">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            ¡Mensaje enviado!
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Gracias por contactarnos. Un ejecutivo de ventas se pondrá en
            contacto contigo dentro de las próximas 24 horas hábiles.
          </p>
          <Button
            onClick={() => {
              setSubmitted(false);
              setForm({
                nombre: "",
                empresa: "",
                rut: "",
                cargo: "",
                email: "",
                telefono: "",
                empleados: "",
                mensaje: "",
              });
              setTouched({});
              setErrors({});
            }}
            className="mt-6 bg-primary hover:opacity-90 text-white rounded-full px-8"
          >
            Enviar otro mensaje
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="contacto" className="py-20 px-4 lg:px-8 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          {/* Left column: info */}
          <div>
            <span className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
              Contacto
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              Digitaliza hoy los viajes de tu equipo
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Completa el formulario y nuestro equipo activará tu cuenta
              corriente corporativa para que empieces a operar con Pullmanbus.
            </p>

            {/* Contact info */}
            <ul className="mt-8 space-y-5">
              {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                    <Icon className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {label}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        className="text-sm font-medium text-foreground hover:text-secondary transition-colors"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        {value}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column: form */}
          <div>
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8"
            >
              {serverError && (
                <div className="mb-5 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {serverError}
                </div>
              )}

              <div className="space-y-5">
                {/* Row: Nombre + Empresa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-card-foreground">
                      Nombre completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Juan Pérez"
                      value={form.nombre}
                      autoComplete="name"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleChange("nombre", e.target.value)
                      }
                      onBlur={() => handleBlur("nombre")}
                      className={cn(
                        "h-11 rounded-xl border-border bg-background",
                        touched.nombre && errors.nombre && "border-red-500",
                      )}
                    />
                    {touched.nombre && errors.nombre && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.nombre}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-card-foreground">
                      Empresa <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Nombre de la empresa"
                      value={form.empresa}
                      autoComplete="organization"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleChange("empresa", e.target.value)
                      }
                      onBlur={() => handleBlur("empresa")}
                      className={cn(
                        "h-11 rounded-xl border-border bg-background",
                        touched.empresa && errors.empresa && "border-red-500",
                      )}
                    />
                    {touched.empresa && errors.empresa && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.empresa}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row: RUT + Cargo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-card-foreground">
                      RUT empresa
                    </Label>
                    <Input
                      placeholder="76.543.210-K"
                      value={form.rut}
                      autoComplete="off"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleChange("rut", formatRut(e.target.value))
                      }
                      className="h-11 rounded-xl border-border bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-card-foreground">
                      Cargo
                    </Label>
                    <Input
                      placeholder="Gerente de Recursos Humanos"
                      value={form.cargo}
                      autoComplete="organization-title"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleChange("cargo", e.target.value)
                      }
                      className="h-11 rounded-xl border-border bg-background"
                    />
                  </div>
                </div>

                {/* Row: Email + Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-card-foreground">
                      Email corporativo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="nombre@empresa.cl"
                      value={form.email}
                      autoComplete="email"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleChange("email", e.target.value)
                      }
                      onBlur={() => handleBlur("email")}
                      className={cn(
                        "h-11 rounded-xl border-border bg-background",
                        touched.email && errors.email && "border-red-500",
                      )}
                    />
                    {touched.email && errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-card-foreground">
                      Teléfono <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="+56 9 1234 5678"
                      value={form.telefono}
                      autoComplete="tel"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleChange("telefono", e.target.value)
                      }
                      onBlur={() => handleBlur("telefono")}
                      className={cn(
                        "h-11 rounded-xl border-border bg-background",
                        touched.telefono && errors.telefono && "border-red-500",
                      )}
                    />
                    {touched.telefono && errors.telefono && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.telefono}
                      </p>
                    )}
                  </div>
                </div>

                {/* Empleados */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-card-foreground">
                    Cantidad de empleados{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={form.empleados}
                    onChange={(e) => handleChange("empleados", e.target.value)}
                    onBlur={() => handleBlur("empleados")}
                    className={cn(
                      "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition",
                      touched.empleados && errors.empleados && "border-red-500",
                      !form.empleados && "text-muted-foreground",
                    )}
                  >
                    <option value="" disabled>
                      Selecciona un rango
                    </option>
                    {RANGE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {touched.empleados && errors.empleados && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.empleados}
                    </p>
                  )}
                </div>

                {/* Mensaje */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-card-foreground">
                    Mensaje
                  </Label>
                  <textarea
                    id="mensaje"
                    rows={4}
                    placeholder="Cuéntanos sobre las necesidades de viaje de tu empresa, rutas frecuentes, etc."
                    value={form.mensaje}
                    onChange={(e) => handleChange("mensaje", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none leading-relaxed"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-full bg-primary-pullman hover:bg-primary-pullman/90 text-white font-semibold text-sm transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Enviando…
                    </span>
                  ) : (
                    "Solicitar información"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
