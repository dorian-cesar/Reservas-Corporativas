"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";
import {
  Paperclip,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File as FileGeneric,
  ExternalLink,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const TIPOS_DOCUMENTO = [
  "HES",
  "Nota de Compra",
  "Nota de Reserva",
  "Comprobante de Pago",
  "Factura",
  "Otro",
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export interface AdjuntoItem {
  id: number;
  cuenta_corriente_id: number;
  tipo_documento: string;
  nombre_original: string;
  s3_key: string;
  s3_url: string;
  url_descarga?: string;
  mime_type?: string;
  tamano_bytes?: number;
  fecha_subida?: string;
  usuario_id?: number;
}

interface AdjuntosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimiento: {
    id: number;
    descripcion?: string;
    monto: number;
    referencia?: string;
    tipo_movimiento?: "abono" | "cargo";
    pagado?: boolean;
  } | null;
  token: string | null;
  onAdjuntosChange?: () => void;
}

export function AdjuntosDialog({
  open,
  onOpenChange,
  movimiento,
  token,
  onAdjuntosChange,
}: AdjuntosDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adjuntos, setAdjuntos] = useState<AdjuntoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (open && movimiento?.id) {
      setTipoDocumento("");
      setSelectedFile(null);
      fetchAdjuntos();
    }
  }, [open, movimiento?.id]);

  const fetchAdjuntos = async () => {
    if (!movimiento?.id) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/current-accounts/${movimiento.id}/adjuntos`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Error al obtener los adjuntos");
      const data = await res.json();
      setAdjuntos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los archivos adjuntos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const MAX_ADJUNTOS = 5;
  const isMaxReached = adjuntos.length >= MAX_ADJUNTOS;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isMaxReached) {
      toast({
        title: "Límite alcanzado",
        description: `No es posible adjuntar más de ${MAX_ADJUNTOS} archivos por movimiento`,
        variant: "destructive",
      });
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "Archivo muy pesado",
          description: "El tamaño máximo permitido es de 25 MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (isMaxReached) {
      toast({
        title: "Límite alcanzado",
        description: `No es posible adjuntar más de ${MAX_ADJUNTOS} archivos por movimiento`,
        variant: "destructive",
      });
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "Archivo muy pesado",
          description: "El tamaño máximo permitido es de 25 MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !movimiento?.id) return;

    if (isMaxReached) {
      toast({
        title: "Límite alcanzado",
        description: `Este movimiento ya cuenta con el máximo permitido de ${MAX_ADJUNTOS} archivos adjuntos.`,
        variant: "destructive",
      });
      return;
    }

    if (!tipoDocumento || !tipoDocumento.trim()) {
      toast({
        title: "Tipo de documento requerido",
        description: "Por favor seleccione el tipo de documento antes de subir el archivo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("tipo_documento", tipoDocumento);

      const res = await fetch(
        `/api/current-accounts/${movimiento.id}/adjuntos`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al subir el archivo");
      }

      toast({
        title: "Archivo adjuntado",
        description: `${selectedFile.name} se ha subido correctamente`,
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await fetchAdjuntos();
      onAdjuntosChange?.();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al subir",
        description: (err as Error).message || "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (adjuntoId: number) => {
    const result = await Swal.fire({
      title: "¿Eliminar archivo adjunto?",
      text: "Esta acción no se puede deshacer y eliminará el archivo permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(adjuntoId);

      // Mostrar loader en SweetAlert2
      Swal.fire({
        title: "Eliminando archivo...",
        text: "Por favor espere mientras se procesa la eliminación.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch(`/api/current-accounts/adjuntos/${adjuntoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al eliminar adjunto");
      }

      await Swal.fire({
        title: "¡Eliminado!",
        text: "El archivo adjunto ha sido eliminado exitosamente.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });

      setAdjuntos((prev) => prev.filter((a) => a.id !== adjuntoId));
      onAdjuntosChange?.();
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Error",
        text: (err as Error).message || "No se pudo eliminar el archivo",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const getFileIcon = (mimeType?: string, fileName?: string) => {
    const name = fileName?.toLowerCase() || "";
    const mime = mimeType?.toLowerCase() || "";

    if (mime.includes("pdf") || name.endsWith(".pdf")) {
      return <FileText className="h-6 w-6 text-red-500 shrink-0" />;
    }
    if (
      mime.includes("sheet") ||
      mime.includes("excel") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      name.endsWith(".csv")
    ) {
      return <FileSpreadsheet className="h-6 w-6 text-green-600 shrink-0" />;
    }
    if (
      mime.includes("image") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png") ||
      name.endsWith(".webp")
    ) {
      return <ImageIcon className="h-6 w-6 text-blue-500 shrink-0" />;
    }
    return <FileGeneric className="h-6 w-6 text-gray-500 shrink-0" />;
  };

  const getBadgeVariantColor = (tipo: string) => {
    switch (tipo) {
      case "HES":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Nota de Compra":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Nota de Reserva":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Comprobante de Pago":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Factura":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!movimiento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Paperclip className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Documentos y Adjuntos
              </DialogTitle>
              <DialogDescription className="text-sm">
                Movimiento #{movimiento.id} •{" "}
                {movimiento.descripcion || "Sin descripción"} (
                {movimiento.tipo_movimiento === "abono" ? "Abono" : "Cargo"})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-2 pr-1">
          {/* Zona de Subida */}
          {isMaxReached ? (
            <div className="border rounded-xl p-4 bg-amber-50/60 border-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Límite máximo alcanzado (5 de 5 archivos)</span>
              </div>
              <p className="text-xs text-amber-700">
                Este movimiento ya contiene el máximo de 5 documentos permitidos. Si necesita adjuntar uno nuevo, por favor elimine primero uno de los archivos existentes en el listado inferior.
              </p>
            </div>
          ) : (
            <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
              <h4 className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Adjuntar nuevo documento
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  ({adjuntos.length} de {MAX_ADJUNTOS} adjuntos)
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1 space-y-1.5">
                  <Label htmlFor="tipo-doc-select" className="text-xs font-semibold">
                    Tipo de Documento *
                  </Label>
                  <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                    <SelectTrigger
                      id="tipo-doc-select"
                      className="w-full bg-white h-9 text-xs"
                    >
                      <SelectValue placeholder="Selecciona tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo} className="text-xs">
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">
                    Archivo (PDF, Imágenes, Excel, etc.)
                  </Label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : selectedFile
                          ? "border-green-500 bg-green-50/30"
                          : "border-muted-foreground/30 hover:border-primary/60 bg-white"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv"
                    />

                    {selectedFile ? (
                      <div className="flex items-center justify-between text-xs gap-2 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="font-medium truncate block min-w-0 flex-1" title={selectedFile.name}>
                            {selectedFile.name}
                          </span>
                          <span className="text-muted-foreground shrink-0">
                            ({formatFileSize(selectedFile.size)})
                          </span>
                        </div>
                        <span className="text-primary hover:underline text-[11px] shrink-0">
                          Cambiar
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>Arrastra o haz clic para seleccionar archivo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading || !tipoDocumento}
                    className="bg-primary hover:bg-primary/90 text-xs h-8 px-4"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        Subiendo a S3...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Subir archivo
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Listado de Adjuntos Existentes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                Archivos adjuntos ({adjuntos.length} de {MAX_ADJUNTOS})
              </h4>
            </div>

            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando archivos adjuntos...
              </div>
            ) : adjuntos.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-gray-50/50">
                <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No hay archivos adjuntos en este movimiento.
                </p>
                <p className="text-xs text-muted-foreground/80 mt-0.5">
                  Puedes subir HES, Notas de Compra, Facturas o Comprobantes
                  arriba.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {adjuntos.map((adj) => (
                  <div
                    key={adj.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50/80 transition-all gap-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                      {getFileIcon(adj.mime_type, adj.nombre_original)}
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                          <p className="text-sm font-semibold text-gray-900 truncate min-w-0 flex-1" title={adj.nombre_original}>
                            {adj.nombre_original}
                          </p>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${getBadgeVariantColor(
                              adj.tipo_documento,
                            )}`}
                          >
                            {adj.tipo_documento}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatFileSize(adj.tamano_bytes)} •{" "}
                          {formatDate(adj.fecha_subida)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {adj.url_descarga && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 px-2.5 text-xs text-blue-700 border-blue-300 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-900"
                        >
                          <a
                            href={adj.url_descarga}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={adj.nombre_original}
                            className="flex items-center text-blue-700 hover:text-blue-900"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1 text-blue-700" />
                            Ver / Descargar
                          </a>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(adj.id)}
                        disabled={deletingId === adj.id}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Eliminar adjunto"
                      >
                        {deletingId === adj.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
