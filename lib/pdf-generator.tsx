import type { Booking } from "./mock-data";

export function generatePDF(
  bookings: Booking[],
  companyName: string,
  monthName: string
) {
  // Calculate totals
  const totalAmount = bookings.reduce((sum, b) => sum + b.price, 0);
  const totalBookings = bookings.length;

  // Group bookings by user for better organization
  const bookingsByUser = bookings.reduce((acc, booking) => {
    if (!acc[booking.userName]) {
      acc[booking.userName] = [];
    }
    acc[booking.userName].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  // Create HTML content for PDF with enhanced styling
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Estado de Pago - ${companyName}</title>
      <style>
        @page {
          margin: 20mm;
        }
        
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          padding: 0;
          margin: 0;
          color: #1e293b;
          line-height: 1.6;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #4fb3d4 0%, #3b8ba5 100%);
          color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(79, 179, 212, 0.2);
        }
        
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        .header p {
          margin: 5px 0;
          font-size: 16px;
          opacity: 0.95;
        }
        
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .info-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #4fb3d4;
        }
        
        .info-card h2 {
          margin: 0 0 15px 0;
          color: #4fb3d4;
          font-size: 18px;
          font-weight: 600;
        }
        
        .info-card p {
          margin: 8px 0;
          font-size: 14px;
          color: #475569;
        }
        
        .info-card strong {
          color: #1e293b;
          font-weight: 600;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .summary-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          text-align: center;
        }
        
        .summary-card .label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .summary-card .value {
          font-size: 28px;
          font-weight: 700;
          color: #4fb3d4;
        }
        
        .user-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .user-header {
          background: #4fb3d4;
          color: white;
          padding: 12px 20px;
          border-radius: 8px 8px 0 0;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .user-total {
          font-size: 18px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          background: white;
          border-radius: 0 0 8px 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        th {
          background: #f1f5f9;
          color: #475569;
          padding: 14px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        td {
          padding: 14px 16px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        tr:hover {
          background: #f8fafc;
        }
        
        .total-section {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-top: 40px;
          box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);
        }
        
        .total-section .summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .total-section .left {
          flex: 1;
        }
        
        .total-section .right {
          text-align: right;
        }
        
        .total-section p {
          margin: 5px 0;
          font-size: 16px;
          opacity: 0.95;
        }
        
        .total-section h3 {
          margin: 10px 0 0 0;
          font-size: 42px;
          font-weight: 700;
          letter-spacing: -1px;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 30px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          border-top: 2px solid #e2e8f0;
        }
        
        .footer p {
          margin: 5px 0;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 12px;
          background: #10b981;
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pullman Bus</h1>
          <p style="font-size: 20px; margin-top: 10px;">Estado de Pago - Reservas Corporativas</p>
          <p style="font-size: 14px; opacity: 0.9; margin-top: 5px;">Sistema de Gestión de Viajes</p>
        </div>

        <div class="info-section">
          <div class="info-card">
            <h2>📋 Información de la Empresa</h2>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Total de Usuarios:</strong> ${
              Object.keys(bookingsByUser).length
            }</p>
          </div>
          <div class="info-card">
            <h2>📅 Detalles del Reporte</h2>
            <p><strong>Período:</strong> ${monthName}</p>
            <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString(
              "es-CL",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}</p>
          </div>
        </div>

        <div class="summary-cards">
          <div class="summary-card">
            <div class="label">Total Reservas</div>
            <div class="value">${totalBookings}</div>
          </div>
          <div class="summary-card">
            <div class="label">Usuarios</div>
            <div class="value">${Object.keys(bookingsByUser).length}</div>
          </div>
          <div class="summary-card">
            <div class="label">Monto Total</div>
            <div class="value">$${totalAmount.toLocaleString()}</div>
          </div>
        </div>

        <h2 style="color: #1e293b; margin: 40px 0 20px 0; font-size: 24px;">Detalle de Reservas por Usuario</h2>

        ${Object.entries(bookingsByUser)
          .map(([userName, userBookings]) => {
            const userTotal = userBookings.reduce((sum, b) => sum + b.price, 0);
            return `
            <div class="user-section">
              <div class="user-header">
                <span>👤 ${userName} (${userBookings[0].userEmail})</span>
                <span class="user-total">${userBookings.length} reserva${
              userBookings.length > 1 ? "s" : ""
            } - $${userTotal.toLocaleString()}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Ruta</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Asiento</th>
                    <th>Estado</th>
                    <th style="text-align: right;">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  ${userBookings
                    .map(
                      (booking) => `
                    <tr>
                      <td><strong>${booking.origin}</strong> → <strong>${
                        booking.destination
                      }</strong></td>
                      <td>${new Date(booking.date).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}</td>
                      <td>${booking.departureTime}</td>
                      <td><strong>${booking.seatNumber}</strong></td>
                      <td><span class="badge">Confirmada</span></td>
                      <td style="text-align: right; font-weight: 600; color: #4fb3d4;">$${booking.price.toLocaleString()}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `;
          })
          .join("")}

        <div class="total-section">
          <div class="summary">
            <div class="left">
              <p style="font-size: 18px; margin-bottom: 5px;">💼 Resumen del Período</p>
              <p><strong>${totalBookings}</strong> reservas confirmadas</p>
              <p><strong>${
                Object.keys(bookingsByUser).length
              }</strong> usuarios activos</p>
            </div>
            <div class="right">
              <p style="font-size: 18px; opacity: 0.9;">Total a Pagar</p>
              <h3>$${totalAmount.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div class="footer">
          <p style="font-weight: 600; color: #475569;">Pullman Bus - Sistema de Reservas Corporativas</p>
          <p>Documento generado automáticamente el ${new Date().toLocaleString(
            "es-CL",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          )}</p>
          <p style="margin-top: 15px; font-size: 11px;">Este documento es válido como comprobante de reservas realizadas durante el período indicado.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Create a blob and download
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `estado-pago-${companyName.replace(
    /\s+/g,
    "-"
  )}-${monthName.replace(/\s+/g, "-")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
