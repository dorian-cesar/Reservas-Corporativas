import { NextRequest, NextResponse } from "next/server";

interface BookingRequest {
  serviceId: string;
  seatNumber: string;
  price: number;
  passengerName: string;
  passengerEmail: string;
  passengerRut: string;
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
      passengerRut,
      originId,
      destinationId,
      travelDate,
      busType,
      routeId,
      availableSeats,
      cost,
      boardingAt,
    } = body;

    if (!serviceId || !seatNumber) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const isProduction = process.env.NEXT_PUBLIC_KUPOS_ENV === "prod";
    const apiKey = isProduction
      ? process.env.NEXT_PUBLIC_KUPOS_API_KEY_PROD
      : process.env.NEXT_PUBLIC_KUPOS_API_KEY_DEV;
    const URL_KUPOS = isProduction
      ? process.env.NEXT_PUBLIC_URL_KUPOS_PROD
      : process.env.NEXT_PUBLIC_URL_KUPOS_DEV;

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
              name: passengerName,
              age: "40",
              sex: "M",
              is_primary: "true",
              id_card_type: "1",
              id_card_number: passengerRut,
              id_card_issued_by: "oneone",
            },
          ],
        },
        contact_detail: {
          mobile_number: "948572473",
          emergency_name: passengerName,
          email: passengerEmail,
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

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(bookingPayload),
    });

    if (!response.ok) {
      let kuposError: any;
      try {
        kuposError = await response.json();
      } catch {
        kuposError = await response.text();
      }

      const KuposMessage = kuposError?.response?.message?.toString() || "";

      const isSeatError =
        KuposMessage.includes("434") ||
        KuposMessage.toLowerCase().includes("seat number not found") ||
        KuposMessage.toLowerCase().includes("seat fare mismatched");

      if (isSeatError) {
        return NextResponse.json(
          {
            success: false,
            type: "SEAT_UNAVAILABLE",
            error: "El asiento ya está reservado o no está disponible.",
            details: kuposError,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          type: "KUPOS_ERROR",
          error: "Error al reservar el asiento",
          details: kuposError,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const kuposMessageOk = data?.response?.message?.toString() || "";
    const kuposCodeOk = data?.response?.code?.toString() || "";

    const isSeatErrorOk =
      kuposCodeOk === "400" ||
      kuposMessageOk.includes("434") ||
      kuposMessageOk.toLowerCase().includes("seat number not found") ||
      kuposMessageOk.toLowerCase().includes("seat fare mismatched");

    if (isSeatErrorOk) {
      return NextResponse.json(
        {
          success: false,
          type: "SEAT_UNAVAILABLE",
          error: "El asiento ya está reservado o no está disponible.",
          details: data,
        },
        { status: 400 }
      );
    }

    if (!data.result || !data.result.ticket_details) {
      return NextResponse.json(
        {
          success: false,
          type: "INTERNAL_ERROR",
          error:
            "No se pudo reservar el asiento. Intente nuevamente o busque otro servicio.",
          details: data,
        },
        { status: 400 }
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
