import type { Booking } from "./mock-data"

export function generateTicketPDF(booking: Booking) {
  const ticketHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pasaje - ${booking.id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          min-height: 100vh;
        }
        
        .ticket {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .ticket-header {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          padding: 40px;
          color: white;
          text-align: center;
        }
        
        .ticket-header h1 {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .ticket-header p {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .ticket-body {
          padding: 40px;
        }
        
        .route-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 15px;
        }
        
        .location {
          flex: 1;
          text-align: center;
        }
        
        .location-label {
          font-size: 14px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .location-name {
          font-size: 28px;
          font-weight: bold;
          color: #0f172a;
        }
        
        .route-arrow {
          font-size: 40px;
          color: #06b6d4;
          margin: 0 20px;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 25px;
          margin-bottom: 40px;
        }
        
        .detail-item {
          padding: 20px;
          background: #f8fafc;
          border-radius: 10px;
          border-left: 4px solid #06b6d4;
        }
        
        .detail-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .detail-value {
          font-size: 20px;
          font-weight: bold;
          color: #0f172a;
        }
        
        .seat-section {
          text-align: center;
          padding: 30px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 15px;
          margin-bottom: 30px;
        }
        
        .seat-label {
          font-size: 14px;
          color: #92400e;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .seat-number {
          font-size: 48px;
          font-weight: bold;
          color: #f97316;
        }
        
        .passenger-section {
          padding: 25px;
          background: #f1f5f9;
          border-radius: 10px;
          margin-bottom: 30px;
        }
        
        .passenger-title {
          font-size: 16px;
          color: #475569;
          font-weight: 600;
          margin-bottom: 15px;
        }
        
        .passenger-info {
          display: grid;
          gap: 10px;
        }
        
        .passenger-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #cbd5e1;
        }
        
        .passenger-row:last-child {
          border-bottom: none;
        }
        
        .passenger-label {
          color: #64748b;
          font-size: 14px;
        }
        
        .passenger-value {
          font-weight: 600;
          color: #0f172a;
          font-size: 14px;
        }
        
        .price-section {
          text-align: center;
          padding: 25px;
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          border-radius: 10px;
          margin-bottom: 30px;
        }
        
        .price-label {
          font-size: 14px;
          color: #166534;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .price-value {
          font-size: 36px;
          font-weight: bold;
          color: #15803d;
        }
        
        .booking-code {
          text-align: center;
          padding: 20px;
          background: #f8fafc;
          border-radius: 10px;
          border: 2px dashed #cbd5e1;
        }
        
        .booking-code-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 5px;
        }
        
        .booking-code-value {
          font-size: 18px;
          font-weight: bold;
          color: #0f172a;
          font-family: 'Courier New', monospace;
        }
        
        .ticket-footer {
          padding: 30px;
          text-align: center;
          background: #f8fafc;
          color: #64748b;
          font-size: 12px;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .ticket {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="ticket-header">
          <h1>🚌 Pasaje de Viaje</h1>
          <p>Sistema de Reservas Corporativas</p>
        </div>
        
        <div class="ticket-body">
          <div class="route-section">
            <div class="location">
              <div class="location-label">Origen</div>
              <div class="location-name">${booking.origin}</div>
            </div>
            <div class="route-arrow">→</div>
            <div class="location">
              <div class="location-label">Destino</div>
              <div class="location-name">${booking.destination}</div>
            </div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Fecha de Viaje</div>
              <div class="detail-value">${new Date(booking.date).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Hora de Salida</div>
              <div class="detail-value">${booking.departureTime}</div>
            </div>
          </div>
          
          <div class="seat-section">
            <div class="seat-label">Asiento Asignado</div>
            <div class="seat-number">${booking.seatNumber}</div>
          </div>
          
          <div class="passenger-section">
            <div class="passenger-title">Información del Pasajero</div>
            <div class="passenger-info">
              <div class="passenger-row">
                <span class="passenger-label">Nombre:</span>
                <span class="passenger-value">${booking.userName}</span>
              </div>
              <div class="passenger-row">
                <span class="passenger-label">Email:</span>
                <span class="passenger-value">${booking.userEmail}</span>
              </div>
              <div class="passenger-row">
                <span class="passenger-label">Empresa:</span>
                <span class="passenger-value">${booking.companyName}</span>
              </div>
            </div>
          </div>
          
          <div class="price-section">
            <div class="price-label">Precio Total</div>
            <div class="price-value">$ ${booking.price.toLocaleString("es-AR")}</div>
          </div>
          
          <div class="booking-code">
            <div class="booking-code-label">Código de Reserva</div>
            <div class="booking-code-value">${booking.id.toUpperCase()}</div>
          </div>
        </div>
        
        <div class="ticket-footer">
          <p>Presentar este pasaje al momento de abordar el bus</p>
          <p>Reservado el ${new Date(booking.bookedAt).toLocaleDateString("es-AR")} a las ${new Date(booking.bookedAt).toLocaleTimeString("es-AR")}</p>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `

  const blob = new Blob([ticketHTML], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `pasaje-${booking.id}-${booking.seatNumber}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  // Open in new window for printing
  const printWindow = window.open(url, "_blank")
  if (printWindow) {
    printWindow.focus()
  }
}
