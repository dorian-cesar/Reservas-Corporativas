"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";

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
    input: "swal-input",
    inputLabel: "swal-input-label",
    validationMessage: "swal-validation-message",
    actions: "swal-actions gap-3",
    confirmButton:
      "swal-confirm-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-destructive/80 text-destructive-foreground hover:bg-destructive h-10 py-2 px-4 cursor-pointer",
    cancelButton:
      "swal-cancel-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 cursor-pointer",
    footer: "swal-footer",
  },
  buttonsStyling: false,
  reverseButtons: true,
};

export default function TicketPDFButton({
  ticketNumber,
}: {
  ticketNumber: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/tickets/pdf?ticketNumber=${ticketNumber}`);

      if (!res.ok) {
        throw new Error("No se pudo obtener el PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `boleto-${ticketNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando PDF:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al descargar el PDF.",
        confirmButtonText: "Cerrar",
        ...swalConfig,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="flex-1 gap-2 py-2"
      onClick={handleDownload}
      disabled={loading}
    >
      <Download className="h-4 w-4" />
      {loading ? "Generando..." : "Descargar PDF"}
    </Button>
  );
}
