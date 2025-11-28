"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download } from "lucide-react";

const safeTicketHtml = (data: any) => `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Ticket</title>

  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
      color: #222;
    }

    .container {
      width: 600px;
      margin: 0 auto;
      padding: 24px 0;
    }

    .header {
      text-align: center;
      padding: 20px 0;
    }

    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #1e3a8a;
    }

    .success-message {
      text-align: center;
      margin-bottom: 16px;
    }

    .success-message h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 6px 0;
    }

    .success-message p {
      font-size: 14px;
      color: #555;
      margin: 0;
    }

    .ticket-card {
      background: #fff;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .ticket-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .ticket-header h2 {
      margin: 0 0 10px 0;
      font-size: 18px;
      font-weight: bold;
    }

    .reservation-badge {
      display: inline-block;
      background: #1e40af;
      color: #fff;
      padding: 10px 18px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: bold;
    }

    .ticket-details {
      margin-top: 20px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .detail-item {
      width: 48%;
      display: flex;
      gap: 10px;
    }

    .icon-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }

    .icon-orange {
      background: #ff6b35;
    }

    .icon-blue {
      background: #1e40af;
    }

    .icon-gray {
      background: #e5e7eb;
      border-radius: 6px;
    }

    .detail-content h3 {
      font-size: 11px;
      margin: 0 0 4px 0;
      color: #666;
      text-transform: uppercase;
      font-weight: bold;
    }

    .detail-content p {
      font-size: 14px;
      margin: 0;
      color: #111;
    }

    .download-button {
      display: block;
      width: 260px;
      margin: 24px auto 0;
      background: #1e40af;
      text-align: center;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: bold;
      text-decoration: none;
      color: white;
      border-radius: 20px;
    }
  </style>
</head>

<body>
  <div class="container">

    <div class="header">
      <div class="logo">Pullman Bus</div>
    </div>

    <div class="success-message">
      <h1>¡Todo listo!</h1>
      <p>Tu pasaje fue confirmado con éxito.</p>
    </div>

    <div class="ticket-card">

      <div class="ticket-header">
        <h2>Detalle de tu compra</h2>
        <div class="reservation-badge">
          Nº DE RESERVA: ${data.reservationNumber}
        </div>
      </div>

      <div class="ticket-details">

        <div class="detail-row">
          <div class="detail-item">
            <div class="icon-circle icon-orange"></div>
            <div class="detail-content">
              <h3>Origen</h3>
              <p>${data.origin}</p>
            </div>
          </div>

          <div class="detail-item">
            <div class="icon-circle icon-blue"></div>
            <div class="detail-content">
              <h3>Destino</h3>
              <p>${data.destination}</p>
            </div>
          </div>
        </div>

        <div class="detail-row">

          <div class="detail-item">
            <div class="icon-gray"></div>
            <div class="detail-content">
              <h3>Fecha de viaje</h3>
              <p>${data.travelDate}</p>
            </div>
          </div>

          <div class="detail-item">
            <div class="icon-gray"></div>
            <div class="detail-content">
              <h3>Horario salida</h3>
              <p>${data.travelTime}</p>
            </div>
          </div>

        </div>
      </div>

      <a class="download-button" href="${data.downloadUrl}" target="_blank">
        DESCARGAR PASAJE
      </a>

    </div>
  </div>
</body>
</html>`;

export default function TicketPDFButton({ booking }: { booking: any }) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    if (!booking) return;
    setLoading(true);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    iframe.style.width = "640px";
    iframe.style.height = "900px";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      setLoading(false);
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(
      safeTicketHtml({
        reservationNumber: booking.ticketNumber,
        origin: booking.origin,
        destination: booking.destination,
        company: booking.companyName,
        travelDate: booking.travelDate,
        travelTime: booking.departureTime,
        downloadUrl: booking.downloadUrl || "",
      })
    );
    doc.close();

    await new Promise<void>((resolve) => {
      const onLoad = () => {
        setTimeout(() => resolve(), 80);
      };
      iframe.addEventListener("load", onLoad, { once: true });
      setTimeout(() => resolve(), 300);
    });

    try {
      const iframeDoc = iframe.contentDocument!;
      const body = iframeDoc.body;

      const elements = Array.from(body.querySelectorAll<HTMLElement>("*"));
      elements.forEach((el) => {
        el.style.color =
          el.style.color || window.getComputedStyle(el).color || "#111";
        el.style.backgroundColor = el.style.backgroundColor || "transparent";
        el.style.borderColor = el.style.borderColor || "#e5e7eb";
      });

      const canvas = await html2canvas(body, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210; // mm
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      const filename = `ticket-${
        booking.ticketNumber || booking.id || "ticket"
      }.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Error generando PDF:", err);
      throw err;
    } finally {
      setLoading(false);
      document.body.removeChild(iframe);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="flex-1 gap-2"
      onClick={generatePDF}
      disabled={loading}
    >
      <Download className="h-4 w-4" />
      {loading ? "Generando..." : "Descargar PDF"}
    </Button>
  );
}
