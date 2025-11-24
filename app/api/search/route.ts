import { NextRequest, NextResponse } from "next/server";

export interface BusService {
  id: number;
  number: string;
  name: string;
  operator_service_name: string;
  origin_id: number;
  destination_id: number;
  route_id: number;
  travel_id: number;
  bus_type: string;
  dep_time: string;
  arr_time: string;
  duration: string;
  available_seats: number;
  total_seats: number;
  fare_str: string;
  is_cancellable: boolean;
  amenities: string | null;
  travel_name: string;
  is_direct_trip: boolean;
  price: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const originId = searchParams.get("originId");
    const destinationId = searchParams.get("destinationId");
    const date = searchParams.get("date");

    if (!originId || !destinationId || !date) {
      return NextResponse.json(
        { error: "Missing required parameters: originId, destinationId, date" },
        { status: 400 }
      );
    }

    const originIdNum = parseInt(originId);
    const destinationIdNum = parseInt(destinationId);

    if (isNaN(originIdNum) || isNaN(destinationIdNum)) {
      return NextResponse.json(
        { error: "Invalid originId or destinationId" },
        { status: 400 }
      );
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // const apiKey = process.env.KUPOS_API_KEY_PROD;
    // const URL_KUPOS = process.env.URL_KUPOS_PROD;

    const apiKey = process.env.KUPOS_API_KEY_DEV;
    const URL_KUPOS = process.env.URL_KUPOS_DEV;

    if (!apiKey || !URL_KUPOS) {
      return NextResponse.json(
        { error: "API configuration missing" },
        { status: 500 }
      );
    }

    const apiUrl = `${URL_KUPOS}/ui_schedules/${originIdNum}/${destinationIdNum}/${date}.json?api_key=${apiKey}`;

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "Kupos API response not OK:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: `Kupos API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.result || !Array.isArray(data.result) || data.result.length < 2) {
      return NextResponse.json({ services: [] });
    }

    const headers = data.result[0] as string[];
    const services = data.result.slice(1) as any[];

    const formattedServices: BusService[] = services
      .map((service) => {
        const serviceData: any = {};
        headers.forEach((header, index) => {
          serviceData[header] = service[index];
        });

        // Parsear precio desde fare_str (ejemplo: "CLASICO:2000.0")
        let price = 0;
        if (serviceData.fare_str) {
          const fareMatch = serviceData.fare_str.match(/(\d+\.?\d*)/);
          price = fareMatch ? parseFloat(fareMatch[1]) : 0;
        }

        return {
          id: serviceData.id || 0,
          number: serviceData.number || "",
          name: serviceData.name || "",
          operator_service_name: serviceData.operator_service_name || "",
          origin_id: serviceData.origin_id || 0,
          destination_id: serviceData.destination_id || 0,
          route_id: serviceData.route_id || 0,
          travel_id: serviceData.travel_id || 0,
          bus_type: serviceData.bus_type || "",
          dep_time: serviceData.dep_time || "",
          arr_time: serviceData.arr_time || "",
          duration: serviceData.duration || "",
          available_seats: serviceData.available_seats || 0,
          total_seats: serviceData.total_seats || 0,
          fare_str: serviceData.fare_str || "",
          is_cancellable: Boolean(serviceData.is_cancellable),
          amenities: serviceData.amenities || null,
          travel_name: serviceData.travel_name || "",
          is_direct_trip: Boolean(serviceData.is_direct_trip),
          price: price,
        };
      })
      .filter((service) => service.id !== 0); // Filtrar servicios inválidos

    return NextResponse.json({
      services: formattedServices,
      meta: {
        total: formattedServices.length,
        originId: originIdNum,
        destinationId: destinationIdNum,
        date: date,
      },
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
