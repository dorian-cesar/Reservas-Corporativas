"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, CheckCircle2, Bus } from "lucide-react";
import { ServiceDetailDialog } from "@/components/service-detail-dialog";
import { useTravel } from "@/components/context/travel-context";

interface BusService {
  id: number;
  number: string;
  name: string;
  operator_service_name: string;
  bus_type: string;
  dep_time: string;
  arr_time: string;
  duration: string;
  available_seats: number;
  total_seats: number;
  fare_str: string;
  travel_name: string;
  price: number;
  amenities: string | null;
  is_cancellable: boolean;
}

interface BusServiceCardProps {
  service: BusService;
}

export function BusServiceCard({ service }: BusServiceCardProps) {
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  const availabilityPercentage =
    (service.available_seats / service.total_seats) * 100;
  const { origin, destination } = useTravel();

  const getAvailabilityVariant = () => {
    if (service.available_seats === 0) return "destructive";
    if (availabilityPercentage < 30) return "secondary";
    return "default";
  };

  const getMainBusType = (busType: string | null | undefined): string => {
    if (!busType) return "";
    const parts = busType.split(",").map((p) => p.trim());
    const ignore = ["2+2", "2+1", "AC", "Video", "WiFi", "Baño"];
    const main = parts.find((p) => !ignore.includes(p));
    return main || parts[0];
  };

  const getAmenities = () => {
    const amenities = [];
    if (service.bus_type?.includes("AC")) amenities.push("Aire Acondicionado");
    if (
      service.bus_type?.includes("WiFi") ||
      service.amenities?.includes("wifi")
    )
      amenities.push("WiFi");
    if (service.bus_type?.includes("Video")) amenities.push("Entretenimiento");
    return amenities;
  };

  const amenities = getAmenities();

  return (
    <>
      <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">{service.travel_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {origin} - {destination}
              </div>
            </div>
            <Badge variant={getAvailabilityVariant()}>
              {service.available_seats === 0
                ? "Agotado"
                : `${service.available_seats} asientos`}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Salida</p>
              <p className="font-bold text-lg">{service.dep_time}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
                <Clock className="h-3 w-3" />
                Duración
              </p>
              <p className="font-bold">{service.duration}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Llegada</p>
              <p className="font-bold text-lg">{service.arr_time}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">
                {service.total_seats - service.available_seats} de{" "}
                {service.total_seats} ocupados
              </span>
            </div>
            <div className="flex items-center gap-1 text-2xl font-bold text-primary">
              <span>$</span>
              {service.price.toLocaleString("es-CL")}
            </div>
          </div>

          {service.bus_type && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <strong>Tipo de bus:</strong> {getMainBusType(service.bus_type)}
              </div>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1 pb-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Disponibilidad</span>
              <span>{Math.round(availabilityPercentage)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  availabilityPercentage > 50
                    ? "bg-green-600"
                    : availabilityPercentage > 20
                    ? "bg-yellow-600"
                    : "bg-red-600"
                }`}
                style={{ width: `${availabilityPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={() => setShowServiceDetail(true)}
            disabled={service.available_seats === 0}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200"
            size="lg"
          >
            {service.available_seats === 0 ? (
              "Agotado"
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Seleccionar Asiento
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <ServiceDetailDialog
        serviceId={service.id}
        open={showServiceDetail}
        onOpenChange={setShowServiceDetail}
      />
    </>
  );
}
