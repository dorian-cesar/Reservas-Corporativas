import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { ticketNumber, seatNumbers } = await req.json();

    if (!ticketNumber || !seatNumbers) {
      return NextResponse.json(
        { error: "Ticket number y seat numbers son requeridos" },
        { status: 400 }
      );
    }

    const isProd = process.env.KUPOS_ENV === "prod";

    const apiKey = isProd
      ? process.env.KUPOS_API_KEY_PROD
      : process.env.KUPOS_API_KEY_DEV;

    const URL_KUPOS = isProd
      ? process.env.URL_KUPOS_PROD
      : process.env.URL_KUPOS_DEV;

    if (!apiKey || !URL_KUPOS) {
      return NextResponse.json(
        { error: "API configuration missing" },
        { status: 500 }
      );
    }

    const url = `${URL_KUPOS}/cancel_booking.json?ticket_number=${ticketNumber}&seat_numbers=${seatNumbers}&api_key=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Kupos API error:", errorText);
      return NextResponse.json(
        {
          error: "Error al anular la reserva en el sistema",
          resData: response,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.result && data.result.cancel_ticket) {
      return NextResponse.json({
        success: true,
        message: "Reserva anulada exitosamente",
        data: data,
        refundAmount: data.result.cancel_ticket.refund_amount,
        cancellationCharges: data.result.cancel_ticket.cancellation_charges,
        seatNumbers: data.result.cancel_ticket.seat_numbers,
        cancelSeatDetails: data.result.cancel_ticket.cancel_seat_details,
      });
    } else {
      console.error("Unexpected Kupos response structure:", data);
      return NextResponse.json(
        {
          error: data.message || "Error inesperado al anular la reserva",
          responseData: data,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in cancel ticket API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
