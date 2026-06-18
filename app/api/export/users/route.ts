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
        u.id, 
        u.nombre, 
        u.rut, 
        u.email, 
        u.rol, 
        e.nombre AS nombre_empresa, 
        cc.nombre AS nombre_centro_costo
      FROM users u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      LEFT JOIN centros_costo cc ON u.centro_costo_id = cc.id
    `;

    const [rows] = await pool.query(query);

    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error("Error al exportar usuarios:", err);
    return NextResponse.json(
      { message: "Error interno del servidor", error: err.message },
      { status: 500 }
    );
  }
}
