import { NextRequest, NextResponse } from "next/server";

interface BookingRequest {
  serviceId: string;
  seatNumber: string;
  price: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  originId: number;
  destinationId: number;
  travelDate: string;
  busType: string;
  routeId: number;
  availableSeats: number;
  cost: string;
  boardingAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json();

    const {
      serviceId,
      seatNumber,
      price,
      passengerName,
      passengerEmail,
      passengerPhone,
      originId,
      destinationId,
      travelDate,
      busType,
      routeId,
      availableSeats,
      cost,
      boardingAt,
    } = body;

    if (
      !serviceId ||
      !seatNumber
      //   !seatNumber ||
      //   !passengerName ||
      //   !passengerEmail ||
      //   !passengerPhone
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
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

    const bookingPayload = {
      book_ticket: {
        seat_details: {
          seat_detail: [
            {
              seat_number: seatNumber,
              fare: price.toString(),
              title: "Mr",
              name: "Juan Perez",
              age: "40",
              sex: "M",
              is_primary: "true",
              id_card_type: "1",
              id_card_number: "1234567890",
              id_card_issued_by: "oneone",
            },
          ],
        },
        contact_detail: {
          mobile_number: "948572473",
          emergency_name: "Juan Perez",
          email: "juanperez@wit.la",
        },
      },
      origin_id: originId,
      destination_id: destinationId,
      boarding_at: boardingAt,
      no_of_seats: "1",
      travel_date: travelDate,
      available_seats: availableSeats,
      cost: cost,
      bus_type: busType,
      route_id: routeId,
    };

    const apiUrl = `${URL_KUPOS}/tentative_booking/${serviceId}.json?api_key=${apiKey}`;

    console.log("Calling booking API:", apiUrl);
    console.log("Booking payload:", JSON.stringify(bookingPayload, null, 2));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(bookingPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Booking API error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `Error en reserva: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.result || !data.result.ticket_details) {
      return NextResponse.json(
        { error: "Respuesta inválida de la API de reserva", data },
        { status: 500 }
      );
    }

    const ticketDetails = data.result.ticket_details;

    return NextResponse.json({
      success: true,
      pnrNumber: ticketDetails.pnr_number,
      operatorPnr: ticketDetails.operator_pnr,
      travelId: ticketDetails.travel_id,
      travelName: ticketDetails.travel_name,
      seatNumber: seatNumber,
      bookingDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Booking API Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
