import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const tokenHeader = req.headers.get("authorization");
    if (!tokenHeader) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const token = tokenHeader.startsWith("Bearer ") ? tokenHeader.slice(7) : tokenHeader;
    let payload;
    try {
      const payloadStr = Buffer.from(token.split(".")[1], "base64").toString("utf-8");
      payload = JSON.parse(payloadStr);
    } catch (e) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    if (payload.rol !== "superuser") {
      return NextResponse.json({ message: "Prohibido: Solo superusuario" }, { status: 403 });
    }

    const pool = getDbPool();
    const query = `
      SELECT 
        id, 
        nombre, 
        recargo, 
        porcentaje_devolucion, 
        dia_facturacion, 
        dia_vencimiento, 
        monto_maximo, 
        monto_acumulado, 
        rut, 
        cuenta_corriente 
      FROM empresas
    `;

    const [rows] = await pool.query(query);

    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error("Error al exportar empresas:", err);
    return NextResponse.json(
      { message: "Error interno del servidor", error: err.message },
      { status: 500 }
    );
  }
}
