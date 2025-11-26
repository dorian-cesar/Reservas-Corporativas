import { NextResponse } from "next/server";

const URL_BACKEND = process.env.URL_BACKEND;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const { ticketStatus, monto_devolucion } = await req.json();

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID es requerido" },
        { status: 400 }
      );
    }

    if (!URL_BACKEND) {
      return NextResponse.json(
        { error: "URL_BACKEND no configurada" },
        { status: 500 }
      );
    }

    const url = `${URL_BACKEND}/api/tickets/${ticketId}`;

    console.log("Actualizando ticket en backend:", url);
    console.log("Datos a actualizar:", { ticketStatus, monto_devolucion });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticketStatus,
        monto_devolucion,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error actualizando ticket en backend:", errorText);
      return NextResponse.json(
        {
          error: "Error al actualizar el ticket en la base de datos",
          backendError: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Ticket actualizado exitosamente:", data);

    return NextResponse.json({
      success: true,
      message: "Ticket actualizado exitosamente",
      data: data,
    });
  } catch (error) {
    console.error("Error in update ticket API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
