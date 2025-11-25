import { NextRequest, NextResponse } from "next/server";

interface ConfirmRequest {
  pnrNumber: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmRequest = await request.json();
    const { pnrNumber } = body;

    if (!pnrNumber) {
      return NextResponse.json(
        { error: "PNR number es requerido" },
        { status: 400 }
      );
    }

    const isProduction = process.env.KUPOS_ENV === "prod";
    const apiKey = isProduction
      ? process.env.KUPOS_API_KEY_PROD
      : process.env.KUPOS_API_KEY_DEV;
    const URL_KUPOS = isProduction
      ? process.env.URL_KUPOS_PROD
      : process.env.URL_KUPOS_DEV;

    if (!apiKey || !URL_KUPOS) {
      return NextResponse.json(
        { error: "Configuración de API no disponible" },
        { status: 500 }
      );
    }

    const apiUrl = `${URL_KUPOS}/confirm_booking/${pnrNumber}.json?api_key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Confirm API error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `Error en confirmación: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.result || !data.result.ticket_details) {
      return NextResponse.json(
        { error: "Respuesta inválida de la API de confirmación" },
        { status: 500 }
      );
    }

    const ticketDetails = data.result.ticket_details;

    return NextResponse.json({
      success: true,
      pnrNumber: pnrNumber,
      ticketNumber: ticketDetails.ticket_number,
      operatorPnr: ticketDetails.operator_pnr,
      ticketStatus: ticketDetails.ticket_status,
      travelName: ticketDetails.travels,
      serviceNumber: ticketDetails.service_number,
      origin: ticketDetails.origin,
      destination: ticketDetails.destination,
      travelDate: ticketDetails.travel_date,
      departureTime: ticketDetails.dep_time,
      duration: ticketDetails.duration,
      seatNumbers: ticketDetails.seat_numbers,
      totalFare: ticketDetails.total_fare,
      busType: ticketDetails.bus_type,
      boardingPoint: ticketDetails.boarding_point_details,
      passengerDetails: ticketDetails.passenger_details,
      seatFareDetails: ticketDetails.seat_fare_details,
      qrCode: ticketDetails.booking_details?.qr_code,
      boardingQrCodes: ticketDetails.booking_details?.boarding_qr_code,
      confirmedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Confirm API Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
