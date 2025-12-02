"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      link.download = `ticket-${ticketNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando PDF:", error);
      alert("Error al descargar PDF");
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
