"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import Swal from "sweetalert2";

interface Reclamo {
  id: number;
  ticket_id: number;
  motivo: string;
  descripcion: string;
  estado: string;
  motivo_rechazo: string | null;
  fecha_creacion: string;
  fecha_resolucion: string | null;
  ticket: {
    id: number;
    ticketNumber: string;
    pnrNumber?: string;
    origin: string;
    destination: string;
    terminal_origen?: string;
    terminal_destino?: string;
    travelDate: string;
    departureTime?: string;
    seatNumbers?: string;
    monto_boleto: number;
    user: {
      nombre: string;
      email: string;
    };
    empresa: {
      id: number;
      nombre: string;
      rut: string;
      porcentaje_devolucion: string;
    };
    pasajero?: {
      nombre: string;
      rut: string;
    };
  };
}

export function SuperReclamos() {
  const { token } = useAuth();
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Pendiente");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const swalConfig = {
    customClass: {
      container: "swal-container",
      popup:
        "swal-popup bg-background border-2 border-border rounded-lg shadow-xl",
      header: "swal-header",
      title: "swal-title text-foreground font-bold text-xl",
      closeButton: "swal-close",
      icon: "swal-icon",
      image: "swal-image",
      content: "swal-content text-foreground",
      htmlContainer: "swal-html-container text-foreground",
      input: "swal-input bg-background text-foreground border-input",
      inputLabel: "swal-input-label text-foreground",
      validationMessage: "swal-validation-message",
      actions: "swal-actions gap-3",
      confirmButton:
        "swal-confirm-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 cursor-pointer",
      cancelButton:
        "swal-cancel-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 cursor-pointer",
      footer: "swal-footer",
    },
    buttonsStyling: false,
    reverseButtons: true,
  };

  const loadReclamos = async () => {
    try {
      setLoading(true);
      const url =
        filterStatus === "Todos"
          ? "/api/reclamos"
          : `/api/reclamos?estado=${filterStatus}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Error al cargar reclamos");
      }

      const data = await res.json();
      setReclamos(data);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los reclamos",
        ...swalConfig,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadReclamos();
    }
  }, [token, filterStatus]);

  const handleAceptar = async (reclamo: Reclamo) => {
    const porcentajeDevolucion =
      Number(reclamo.ticket.empresa?.porcentaje_devolucion) || 0;
    const montoReembolso = Math.round(
      reclamo.ticket.monto_boleto * porcentajeDevolucion,
    );

    const result = await Swal.fire({
      title: "¿Aceptar reclamo?",
      html: `
        <div class="text-left space-y-3">
          <p class="text-foreground">Se aprobará este reclamo y se registrará un saldo a favor para la empresa.</p>
          <div class="bg-muted/50 p-3 rounded-lg border">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="text-foreground">Empresa:</div>
              <div class="font-medium">${reclamo.ticket.empresa?.nombre}</div>
              <div class="text-foreground">Boleto:</div>
              <div class="font-medium">$${reclamo.ticket.monto_boleto}</div>
              <div class="text-foreground font-semibold">Reembolso a descontar:</div>
              <div class="font-bold text-green-600">$${montoReembolso}</div>
            </div>
          </div>
        </div>
      `,
      icon: "warning",
      iconColor: "#10b981",
      showCancelButton: true,
      confirmButtonText: "Sí, aceptar",
      cancelButtonText: "Cancelar",
      ...swalConfig,
      customClass: {
        ...swalConfig.customClass,
        confirmButton: swalConfig.customClass.confirmButton.replace(
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "bg-green-600 text-white hover:bg-green-700",
        ),
      },
    });

    if (result.isConfirmed) {
      await procesarReclamo(reclamo.id, "aceptar");
    }
  };

  const handleRechazar = async (reclamo: Reclamo) => {
    const result = await Swal.fire({
      title: "¿Rechazar reclamo?",
      input: "textarea",
      inputLabel: "Motivo del rechazo",
      inputPlaceholder: "Ingrese el motivo del rechazo...",
      inputAttributes: {
        "aria-label": "Motivo del rechazo",
      },
      showCancelButton: true,
      confirmButtonText: "Sí, rechazar",
      cancelButtonText: "Cancelar",
      icon: "warning",
      iconColor: "#ef4444",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Debes ingresar un motivo de rechazo";
        }
      },
      ...swalConfig,
      customClass: {
        ...swalConfig.customClass,
        confirmButton: swalConfig.customClass.confirmButton.replace(
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "bg-red-600 text-white hover:bg-red-700",
        ),
      },
    });

    if (result.isConfirmed && result.value) {
      await procesarReclamo(reclamo.id, "rechazar", result.value);
    }
  };

  const procesarReclamo = async (
    id: number,
    accion: string,
    motivo_rechazo?: string,
  ) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/reclamos/${id}/resolver`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accion, motivo_rechazo }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al procesar el reclamo");
      }

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `El reclamo ha sido ${accion === "aceptar" ? "aceptado" : "rechazado"} correctamente.`,
        ...swalConfig,
      });

      loadReclamos();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo procesar el reclamo",
        ...swalConfig,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (estado: string) => {
    if (estado === "Aceptado") {
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-500/20 whitespace-nowrap">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aceptado
        </Badge>
      );
    }
    if (estado === "Rechazado") {
      return (
        <Badge className="bg-red-500/10 text-red-700 border-red-500/20 whitespace-nowrap">
          <XCircle className="h-3 w-3 mr-1" />
          Rechazado
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 whitespace-nowrap">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <AlertCircle className="h-6 w-6 text-primary" />
            Panel SAC - Reclamos
          </CardTitle>
          <CardDescription>
            Gestión y resolución de reclamos ingresados por usuarios
          </CardDescription>
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-48">
          <label className="text-sm font-medium">Estado</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 border rounded-md bg-background"
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Aceptado">Aceptados</option>
            <option value="Rechazado">Rechazados</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reclamos.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">
              No hay reclamos encontrados
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reclamos.map((reclamo) => (
              <div
                key={reclamo.id}
                className="border-2 rounded-lg p-4 sm:p-5 bg-card hover:border-primary transition-all duration-300 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row gap-6 justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          #{reclamo.ticket.ticketNumber}
                        </Badge>
                        <span className="font-semibold text-lg">
                          {reclamo.motivo}
                        </span>
                      </div>
                      {getStatusBadge(reclamo.estado)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Empresa
                        </span>
                        <p className="font-medium">
                          {reclamo.ticket.empresa?.nombre || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reclamo.ticket.empresa?.rut}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Pasajero / Usuario
                        </span>
                        <p className="font-medium">
                          {reclamo.ticket.pasajero?.nombre ||
                            reclamo.ticket.user?.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reclamo.ticket.pasajero?.rut ||
                            reclamo.ticket.user?.email}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Ruta y Fecha
                        </span>
                        <p className="font-medium">
                          {reclamo.ticket.origin} - {reclamo.ticket.destination}
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold">
                          {reclamo.ticket.travelDate} •{" "}
                          {reclamo.ticket.departureTime || "—"}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Detalles Pasaje
                        </span>
                        <p className="font-medium">
                          Asiento: {reclamo.ticket.seatNumbers || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNR: {reclamo.ticket.pnrNumber || "—"} | Valor: $
                          {reclamo.ticket.monto_boleto}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Terminales
                        </span>
                        <p
                          className="text-xs font-medium truncate"
                          title={reclamo.ticket.terminal_origen}
                        >
                          {reclamo.ticket.terminal_origen || "—"}
                        </p>
                        <p
                          className="text-xs text-muted-foreground truncate"
                          title={reclamo.ticket.terminal_destino}
                        >
                          → {reclamo.ticket.terminal_destino || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-md">
                      <span className="text-sm font-semibold mb-2 block">
                        Descripción del reclamo:
                      </span>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                        {reclamo.descripcion}
                      </p>
                    </div>

                    {reclamo.motivo_rechazo && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-md">
                        <span className="text-sm font-semibold text-red-800 mb-2 block">
                          Motivo de rechazo:
                        </span>
                        <p className="text-sm text-red-900 whitespace-pre-wrap">
                          {reclamo.motivo_rechazo}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Ingresado el {formatDate(reclamo.fecha_creacion)}
                      {reclamo.fecha_resolucion &&
                        ` • Resuelto el ${formatDate(reclamo.fecha_resolucion)}`}
                    </div>
                  </div>

                  {reclamo.estado === "Pendiente" && (
                    <div className="flex flex-col gap-2 min-w-37.5 justify-center border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6 border-border">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAceptar(reclamo)}
                        disabled={processingId === reclamo.id}
                      >
                        {processingId === reclamo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Aceptar
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-400"
                        onClick={() => handleRechazar(reclamo)}
                        disabled={processingId === reclamo.id}
                      >
                        {processingId === reclamo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
