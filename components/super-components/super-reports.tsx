"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  RefreshCcw,
  TrendingUp,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ChevronsUpDown,
  Check,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import Swal from "sweetalert2";

const formatCLP = (monto: number): string =>
  `$${Math.round(Number(monto || 0)).toLocaleString("es-CL")}`;

export function SuperReports() {
  const { user, token } = useAuth();
  const [reportType, setReportType] = useState<"periodo" | "empresa">(
    "periodo",
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);

  // Filtros
  const [meses, setMeses] = useState<string>("6");
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>(
    [],
  );
  const [selectedEmpresaPeriodo, setSelectedEmpresaPeriodo] = useState<string>("todas");
  const [selectedEmpresaDetalle, setSelectedEmpresaDetalle] = useState<string>("todas");
  const [openEmpresaCombo, setOpenEmpresaCombo] = useState<boolean>(false);

  const activeSelectedEmpresa = reportType === "periodo" ? selectedEmpresaPeriodo : selectedEmpresaDetalle;
  const setActiveSelectedEmpresa = reportType === "periodo" ? setSelectedEmpresaPeriodo : setSelectedEmpresaDetalle;

  const selectedEmpresaData = empresas.find(
    (e) => String(e.id) === activeSelectedEmpresa,
  );

  // Datos Reporte Por Periodo
  const [periodoData, setPeriodoData] = useState<{
    periodoInicio: string;
    periodoFin: string;
    periodos: string[];
    empresas: any[];
    totales: any;
  } | null>(null);

  // Datos Reporte Por Empresa
  const [empresaDetalleData, setEmpresaDetalleData] = useState<{
    periodoInicio: string;
    periodoFin: string;
    empresas: any[];
  } | null>(null);

  // Estados para ordenar interactivamente las columnas
  const [sortKey, setSortKey] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null); // Empezar sin ningún orden de columna activo por defecto

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortOrder(null);
      } else {
        setSortOrder("asc");
      }
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Obtener array ordenado de empresas (Reporte 1: Periodos)
  const getOrderedEmpresasPeriodo = () => {
    if (!periodoData) return [];
    if (!sortOrder) return periodoData.empresas;
    return [...periodoData.empresas].sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (sortKey.startsWith("periodo_")) {
        const p = sortKey.replace("periodo_", "");
        valA = a.montosPorPeriodo[p] || 0;
        valB = b.montosPorPeriodo[p] || 0;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
  };

  // Obtener array ordenado de empresas (Reporte 2: Empresas Global)
  const getOrderedEmpresasGlobal = () => {
    if (!empresaDetalleData) return [];
    if (!sortOrder) return empresaDetalleData.empresas;
    return [...empresaDetalleData.empresas].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortKey === "id") {
        valA = a.empresa.id;
        valB = b.empresa.id;
      } else if (sortKey === "nombre") {
        valA = a.empresa.nombre;
        valB = b.empresa.nombre;
      } else if (sortKey === "cuentaCorriente") {
        valA = a.empresa.cuentaCorriente;
        valB = b.empresa.cuentaCorriente;
      } else if (sortKey === "totalEDP") {
        valA = a.totales.totalEDP;
        valB = b.totales.totalEDP;
      } else if (sortKey === "totalAbono") {
        valA = a.totales.totalAbonos;
        valB = b.totales.totalAbonos;
      } else if (sortKey === "saldoActual") {
        valA = a.totales.saldoFinal;
        valB = b.totales.saldoFinal;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
  };

  // Cargar lista de empresas para el filtro
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/companies", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEmpresas(Array.isArray(data) ? data : data.empresas || []);
        }
      } catch (err) {
        console.error("Error al cargar empresas:", err);
      }
    };
    if (token) {
      fetchCompanies();
    }
  }, [token]);

  // Cargar reporte según tipo y filtros
  const fetchReportData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (reportType === "periodo") {
        const query = new URLSearchParams({
          meses,
          empresa_id: selectedEmpresaPeriodo,
        });
        const res = await fetch(`/api/reports/estado-cuenta-periodo?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.message || "Error al obtener reporte por período",
          );
        }
        const data = await res.json();
        setPeriodoData(data);
      } else {
        const query = new URLSearchParams({
          empresa_id: selectedEmpresaDetalle,
        });
        const res = await fetch(`/api/reports/estado-cuenta-empresa?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.message || "Error al obtener detalle por empresa",
          );
        }
        const data = await res.json();
        setEmpresaDetalleData(data);
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo cargar el reporte.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [token, reportType, meses, activeSelectedEmpresa]);

  // Guard de rol — debe ir DESPUÉS de todos los hooks
  if (user?.role !== "superuser") {
    return null;
  }

  // Descarga de Excel
  const handleExportExcel = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const endpoint =
        reportType === "periodo"
          ? "/api/reports/estado-cuenta-periodo/export-excel"
          : "/api/reports/estado-cuenta-empresa/export-excel";

      const query = new URLSearchParams({
        meses,
        empresa_id: reportType === "periodo" ? "todas" : selectedEmpresaDetalle,
      });

      const res = await fetch(`${endpoint}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedDate = new Date()
        .toLocaleDateString("es-CL")
        .replace(/\//g, "_");
      const cleanCompName = selectedEmpresaData
        ? selectedEmpresaData.nombre
            .replace(/[^a-zA-Z0-9]/g, "_")
            .replace(/__+/g, "_")
            .replace(/_$/, "")
        : "Empresa";

      const fileName =
        reportType === "periodo"
          ? `Estado_Cuenta_Global_${meses}_Meses_${formattedDate}.xlsx`
          : `Estado_Cuenta_${cleanCompName}_${empresaDetalleData?.periodoInicio || "2026-07"}_a_${empresaDetalleData?.periodoFin || "Actual"}.xlsx`;

      if (!res.ok) throw new Error("No se pudo generar el archivo Excel");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Reporte Exportado",
        text: "La planilla Excel se ha descargado exitosamente.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error al exportar",
        text: err.message || "No se pudo exportar el reporte a Excel.",
      });
    } finally {
      setExporting(false);
    }
  };

  // Descarga de PDF
  const handleExportPDF = async () => {
    if (!token) return;
    setExportingPdf(true);
    try {
      const endpoint =
        reportType === "periodo"
          ? "/api/reports/estado-cuenta-periodo/export-pdf"
          : "/api/reports/estado-cuenta-empresa/export-pdf";

      const query = new URLSearchParams({
        meses,
        empresa_id: reportType === "periodo" ? "todas" : selectedEmpresaDetalle,
      });

      const res = await fetch(`${endpoint}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedDate = new Date()
        .toLocaleDateString("es-CL")
        .replace(/\//g, "_");
      const cleanCompName = selectedEmpresaData
        ? selectedEmpresaData.nombre
            .replace(/[^a-zA-Z0-9]/g, "_")
            .replace(/__+/g, "_")
            .replace(/_$/, "")
        : "Empresa";

      const fileName =
        reportType === "periodo"
          ? `Estado_Cuenta_Global_${meses}_Meses_${formattedDate}.pdf`
          : `Estado_Cuenta_${cleanCompName}_${empresaDetalleData?.periodoInicio || "2026-07"}_a_${empresaDetalleData?.periodoFin || "Actual"}.pdf`;

      if (!res.ok) throw new Error("No se pudo generar el archivo PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "PDF Exportado",
        text: "El archivo PDF se ha descargado exitosamente.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error al exportar",
        text: err.message || "No se pudo exportar el reporte a PDF.",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y Control Principal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-6 rounded-xl border shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Panel de Reportes Globales</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Consolidado y exportación oficial de Estados de Cuenta y Movimientos
            de Cuenta Corriente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Button
            variant={reportType === "periodo" ? "default" : "outline"}
            onClick={() => setReportType("periodo")}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Estado de Cuenta por Período
          </Button>
          <Button
            variant={reportType === "empresa" ? "default" : "outline"}
            onClick={() => setReportType("empresa")}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Estado de Cuenta por Empresa
          </Button>
        </div>
      </div>

      {/* Bar de Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4 bg-muted/40 p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 flex-1">
          {reportType === "periodo" && (
            <div className="w-full sm:w-48">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Rango de Períodos
              </label>
              <Select value={meses} onValueChange={setMeses}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Seleccionar rango" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Últimos 3 Meses</SelectItem>
                  <SelectItem value="6">Últimos 6 Meses</SelectItem>
                  <SelectItem value="12">Últimos 12 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex-1 min-w-[320px] max-w-120">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Empresa
            </label>
            <Popover open={openEmpresaCombo} onOpenChange={setOpenEmpresaCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openEmpresaCombo}
                  className="w-full justify-between bg-background overflow-hidden font-normal"
                >
                  <span className="truncate">
                    {activeSelectedEmpresa === "todas"
                      ? "Todas las Empresas"
                      : selectedEmpresaData
                        ? `${selectedEmpresaData.id} - ${selectedEmpresaData.nombre}`
                        : "Seleccionar empresa..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Buscar empresa..." />
                  <CommandList>
                    <CommandEmpty>No se encontró la empresa.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="todas Todas las Empresas"
                        onSelect={() => {
                          setActiveSelectedEmpresa("todas");
                          setOpenEmpresaCombo(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            activeSelectedEmpresa === "todas"
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        Todas las Empresas
                      </CommandItem>
                      {empresas.map((company) => {
                        const empIdStr = String(company.id);
                        const isSelected = activeSelectedEmpresa === empIdStr;
                        return (
                          <CommandItem
                            key={company.id}
                            value={`${company.id} ${company.nombre}`}
                            onSelect={() => {
                              setActiveSelectedEmpresa(empIdStr);
                              setOpenEmpresaCombo(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                isSelected ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {company.id} - {company.nombre}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={fetchReportData}
            disabled={loading}
            className="h-9 w-9 p-0 flex items-center justify-center border border-transparent"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          {(reportType === "periodo" ||
            (reportType === "empresa" && selectedEmpresaDetalle !== "todas")) && (
            <>
              <Button
                onClick={handleExportPDF}
                disabled={exportingPdf || loading}
                variant="outline"
                className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                {exportingPdf ? "Generando PDF..." : "Exportar PDF"}
              </Button>
              <Button
                onClick={handleExportExcel}
                disabled={exporting || loading}
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Generando Excel..." : "Exportar Excel (.xlsx)"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* CONTENIDO 1: ESTADO DE CUENTA X PERÍODO */}
      {reportType === "periodo" && (
        <div className="space-y-6">
          {/* Tarjetas de Métricas Rápidas */}
          {periodoData && periodoData.totales && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total EDPs en Período
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCLP(periodoData.totales.grandTotalEDP)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Suma total facturada en los meses seleccionados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Abonos Recibidos
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCLP(periodoData.totales.grandTotalAbono)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Abonos registrados a la cuenta corriente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Diferencia Acumulada
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      periodoData.totales.grandDiferencia > 0
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {formatCLP(periodoData.totales.grandDiferencia)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {periodoData.totales.grandDiferencia > 0
                      ? "Saldo por cobrar acumulado"
                      : "Cuentas al día o a favor"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabla Matriz Multi-Empresa */}
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Estado de Cuenta por Período
                </CardTitle>
                {periodoData && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Rango: {periodoData.periodoInicio} a{" "}
                    {periodoData.periodoFin}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Cargando reporte de datos...
                </div>
              ) : !periodoData || periodoData.empresas.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No se encontraron registros para el filtro seleccionado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-sm text-left border-collapse">
                    <thead className="bg-muted/60 text-foreground text-xs uppercase font-semibold border-b">
                      <tr>
                        <th
                          className="py-3 px-4 border-b whitespace-nowrap cursor-pointer hover:bg-muted transition-colors select-none"
                          onClick={() => handleSort("id")}
                        >
                          <div className="flex items-center gap-1">
                            ID
                            {sortKey === "id" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 border-b whitespace-nowrap cursor-pointer hover:bg-muted transition-colors select-none"
                          onClick={() => handleSort("nombre")}
                        >
                          <div className="flex items-center gap-1">
                            Empresa
                            {sortKey === "nombre" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 border-b whitespace-nowrap cursor-pointer hover:bg-muted transition-colors select-none"
                          onClick={() => handleSort("cuentaCorriente")}
                        >
                          <div className="flex items-center gap-1">
                            Cuenta Corriente
                            {sortKey === "cuentaCorriente" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        {periodoData.periodos.map((p) => (
                          <th
                            key={p}
                            className="py-3 px-4 border-b text-right whitespace-nowrap cursor-pointer hover:bg-muted transition-colors select-none"
                            onClick={() => handleSort(`periodo_${p}`)}
                          >
                            <div className="flex items-center justify-end gap-1">
                              {p}
                              {sortKey === `periodo_${p}` && sortOrder && (
                                <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                              )}
                            </div>
                          </th>
                        ))}
                        <th
                          className="py-3 px-4 border-b text-right bg-primary/10 text-primary whitespace-nowrap cursor-pointer hover:bg-primary/20 transition-colors select-none"
                          onClick={() => handleSort("totalEDP")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Total EDP
                            {sortKey === "totalEDP" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 border-b text-right bg-emerald-500/10 text-emerald-700 whitespace-nowrap cursor-pointer hover:bg-emerald-500/20 transition-colors select-none"
                          onClick={() => handleSort("totalAbono")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Total Abono
                            {sortKey === "totalAbono" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 border-b text-right bg-muted whitespace-nowrap cursor-pointer hover:bg-muted/80 transition-colors select-none"
                          onClick={() => handleSort("saldoActual")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Saldo Actual
                            {sortKey === "saldoActual" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {getOrderedEmpresasPeriodo().map((emp, idx) => (
                        <tr
                          key={emp.id}
                          className={
                            idx % 2 === 0
                              ? "bg-background"
                              : "bg-muted/30 hover:bg-muted/50 transition-colors"
                          }
                        >
                          <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                            {emp.id}
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                            {emp.nombre}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {emp.cuentaCorriente}
                          </td>
                          {periodoData.periodos.map((p) => (
                            <td
                              key={p}
                              className="py-3 px-4 text-right font-mono text-xs whitespace-nowrap"
                            >
                              {formatCLP(emp.montosPorPeriodo[p] || 0)}
                            </td>
                          ))}
                          <td className="py-3 px-4 text-right font-semibold font-mono text-xs bg-primary/5 whitespace-nowrap">
                            {formatCLP(emp.totalEDP)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold font-mono text-xs bg-emerald-500/5 text-emerald-600 whitespace-nowrap">
                            {formatCLP(emp.totalAbono)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold font-mono text-xs whitespace-nowrap ${
                              emp.saldoActual > 0
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {formatCLP(emp.saldoActual)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-amber-500/10 font-bold border-t-2 border-primary">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-primary whitespace-nowrap">
                          TOTALES GENERALES
                        </td>
                        {periodoData.periodos.map((p) => (
                          <td
                            key={p}
                            className="py-3 px-4 text-right font-mono text-xs whitespace-nowrap"
                          >
                            {formatCLP(
                              periodoData.totales.totalesPorPeriodo[p] || 0,
                            )}
                          </td>
                        ))}
                        <td className="py-3 px-4 text-right font-mono text-xs text-primary whitespace-nowrap">
                          {formatCLP(periodoData.totales.grandTotalEDP)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-emerald-600 whitespace-nowrap">
                          {formatCLP(periodoData.totales.grandTotalAbono)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono text-xs whitespace-nowrap ${
                            periodoData.totales.grandSaldoActual > 0
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {formatCLP(periodoData.totales.grandSaldoActual)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONTENIDO 2: ESTADO DE CUENTA POR EMPRESA DETALLE */}
      {reportType === "empresa" && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border">
              Cargando detalle por empresa...
            </div>
          ) : !empresaDetalleData ||
            empresaDetalleData.empresas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border">
              No se encontraron registros de empresas para el período.
            </div>
          ) : selectedEmpresaDetalle === "todas" ? (
            /* VISTA CONSOLIDADA GLOBAL POR EMPRESA (Desde Reinicio) */
            <Card>
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Estado de Cuenta Global por Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/60 text-foreground text-xs uppercase font-semibold border-b">
                      <tr>
                        <th
                          className="py-3 px-4 border-b cursor-pointer hover:bg-muted transition-colors select-none"
                          onClick={() => handleSort("id")}
                        >
                          <div className="flex items-center gap-1">
                            ID
                            {sortKey === "id" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 border-b cursor-pointer hover:bg-muted transition-colors select-none"
                          onClick={() => handleSort("nombre")}
                        >
                          <div className="flex items-center gap-1">
                            Empresa
                            {sortKey === "nombre" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 border-b cursor-pointer hover:bg-muted transition-colors select-none"
                          onClick={() => handleSort("cuentaCorriente")}
                        >
                          <div className="flex items-center gap-1">
                            Cuenta Corriente
                            {sortKey === "cuentaCorriente" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 border-b text-right bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors select-none"
                          onClick={() => handleSort("totalEDP")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Total EDP (+)
                            {sortKey === "totalEDP" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 border-b text-right bg-emerald-500/5 text-emerald-700 cursor-pointer hover:bg-emerald-500/10 transition-colors select-none"
                          onClick={() => handleSort("totalAbono")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Total Abonos (-)
                            {sortKey === "totalAbono" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 border-b text-right bg-muted font-bold cursor-pointer hover:bg-muted/80 transition-colors select-none"
                          onClick={() => handleSort("saldoActual")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Saldo Actual
                            {sortKey === "saldoActual" && sortOrder && (
                              <span className="text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {getOrderedEmpresasGlobal().map((item, idx) => (
                        <tr
                          key={item.empresa.id}
                          className={
                            idx % 2 === 0
                              ? "bg-background"
                              : "bg-muted/30 hover:bg-muted/50 transition-colors"
                          }
                        >
                          <td className="py-3 px-4 font-mono text-xs">
                            {item.empresa.id}
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">
                            {item.empresa.nombre}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                            {item.empresa.cuentaCorriente}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs bg-primary/5">
                            {formatCLP(item.totales.totalEDP)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-emerald-600 font-semibold bg-emerald-500/5">
                            {formatCLP(item.totales.totalAbonos)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono text-xs font-bold bg-muted/30 ${item.totales.saldoFinal > 0 ? "text-amber-600" : "text-emerald-600"}`}
                          >
                            {formatCLP(item.totales.saldoFinal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-amber-500/10 font-bold border-t-2 border-primary">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-primary">
                          TOTALES CONSOLIDADOS
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-primary">
                          {formatCLP(
                            empresaDetalleData.empresas.reduce(
                              (acc, item) => acc + item.totales.totalEDP,
                              0,
                            ),
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-emerald-600">
                          {formatCLP(
                            empresaDetalleData.empresas.reduce(
                              (acc, item) => acc + item.totales.totalAbonos,
                              0,
                            ),
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-foreground bg-muted">
                          {formatCLP(
                            empresaDetalleData.empresas.reduce(
                              (acc, item) => acc + item.totales.saldoFinal,
                              0,
                            ),
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* VISTA DETALLADA: SOLO LA EMPRESA SELECCIONADA */
             empresaDetalleData.empresas
              .filter((item) => String(item.empresa.id) === selectedEmpresaDetalle)
              .map((item) => (
                <Card key={item.empresa.id} className="overflow-hidden border">
                  <CardHeader className="bg-background text-foreground border-b py-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                          <Building2 className="h-5 w-5 text-primary" />
                          {item.empresa.nombre}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          RUT: {item.empresa.rut} &nbsp;|&nbsp; Cuenta
                          Corriente:{" "}
                          <span className="font-mono text-primary font-semibold">
                            {item.empresa.cuentaCorriente}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-xs text-muted-foreground block">
                            Total EDP Facturado
                          </span>
                          <span className="text-base font-bold font-mono text-foreground">
                            {formatCLP(item.totales.totalEDP)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">
                            Total Abonos
                          </span>
                          <span className="text-base font-bold font-mono text-emerald-600">
                            {formatCLP(item.totales.totalAbonos)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">
                            Saldo Actual Cta. Cte.
                          </span>
                          <span
                            className={`text-base font-bold font-mono ${
                              item.totales.saldoFinal > 0
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {formatCLP(item.totales.saldoFinal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna Izquierda: EDPs */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                          <FileSpreadsheet className="h-4 w-4" />
                          EDP (Estados de Pago Emitidos)
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {item.edps.length} EDPs
                        </Badge>
                      </div>
                      {item.edps.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">
                          Sin EDPs emitidos en este rango.
                        </p>
                      ) : (
                        <div className="border rounded-md overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-muted text-muted-foreground">
                              <tr>
                                <th className="p-2">EDP ID</th>
                                <th className="p-2">Período</th>
                                <th className="p-2 text-center">Estado</th>
                                <th className="p-2 text-right">
                                  Monto Facturado
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {item.edps.map((edp: any) => (
                                <tr key={edp.id} className="hover:bg-muted/30">
                                  <td className="p-2 font-mono font-medium">
                                    {edp.edpId}
                                  </td>
                                  <td className="p-2 font-mono">
                                    {edp.periodo}
                                  </td>
                                  <td className="p-2 text-center">
                                    {edp.pagado ? (
                                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] py-0">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />{" "}
                                        Pagado
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] py-0">
                                        <AlertCircle className="h-3 w-3 mr-1" />{" "}
                                        Pendiente
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="p-2 text-right font-mono font-bold">
                                    {formatCLP(edp.montoFacturado)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Columna Derecha: Movimientos Cuenta Corriente */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-600">
                          <CreditCard className="h-4 w-4" />
                          Estado Cuenta Corriente (Abonos / Cargos)
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {item.movimientos.length} Movimientos
                        </Badge>
                      </div>
                      {item.movimientos.length === 0 &&
                      item.saldoReinicio === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">
                          Sin movimientos en cuenta corriente en este rango.
                        </p>
                      ) : (
                        <div className="border rounded-md overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-muted text-muted-foreground">
                              <tr>
                                <th className="p-2">Fecha Abono</th>
                                <th className="p-2">Tipo</th>
                                <th className="p-2">Fecha</th>
                                <th className="p-2 text-right">Monto</th>
                                <th className="p-2 text-right">Saldo $</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {/* Movimientos normales */}
                              {item.movimientos.map((mov: any) => {
                                const fechaAbonoStr = mov.fechaMovimiento
                                  ? new Date(mov.fechaMovimiento)
                                      .toLocaleDateString("es-CL", {
                                        timeZone: "America/Santiago",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })
                                      .replace(/\//g, "-")
                                  : "-";
                                return (
                                  <tr
                                    key={mov.id}
                                    className="hover:bg-muted/30"
                                  >
                                    <td className="p-2 font-mono font-medium">
                                      {fechaAbonoStr}
                                    </td>
                                    <td className="p-2">
                                      <Badge
                                        variant="outline"
                                        className={
                                          mov.tipoMovimiento === "abono"
                                            ? "text-emerald-600 border-emerald-300 bg-emerald-50 text-[10px] py-0"
                                            : "text-amber-700 border-amber-300 bg-amber-50 text-[10px] py-0"
                                        }
                                      >
                                        {mov.tipoMovimiento.toUpperCase()}
                                      </Badge>
                                    </td>
                                    <td className="p-2 text-muted-foreground font-mono">
                                      {mov.fechaMovimiento
                                        ? new Date(
                                            mov.fechaMovimiento,
                                          ).toLocaleDateString("es-CL", {
                                            timeZone: "America/Santiago",
                                          })
                                        : "-"}
                                    </td>
                                    <td className="p-2 text-right font-mono font-semibold">
                                      {formatCLP(mov.monto)}
                                    </td>
                                    <td className="p-2 text-right font-mono font-bold text-muted-foreground">
                                      {formatCLP(mov.saldo)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      )}
    </div>
  );
}
