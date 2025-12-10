"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ComboBox } from "@/components/ui/combobox";
import {
  Search,
  MapPin,
  Calendar,
  Loader2,
  ArrowLeftRight,
} from "lucide-react";
import { BusServiceCard } from "@/components/bus-service-card";
import { useTravel } from "@/components/context/travel-context";
import { useUserStore } from "@/lib/user-store";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";

interface City {
  id: number;
  name: string;
  origin_count: number;
  destination_count: number;
}

interface BusService {
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
  cost: number;
  boarding_stages: string;
  dropoff_stages: string;
  boardingFirst: string | null;
  dropoffLast: string | null;
  terminalOrigen: string | null;
  terminalDestino: string | null;
}

export function TravelSearch() {
  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [selectedDateObject, setSelectedDateObject] = useState<Date | null>(
    null
  );
  const [searchDateString, setSearchDateString] = useState("");
  const [services, setServices] = useState<BusService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { setOrigin: setGlobalOrigin, setDestination: setGlobalDestination } =
    useTravel();
  const user = useUserStore((s) => s.user);
  const loadingUser = useUserStore((s) => s.loading);

  const getTodayLocalStart = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };
  const todayForMinDate = useMemo(() => getTodayLocalStart(), []);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await fetch("/api/cities");
        if (!res.ok) throw new Error("Error loading cities");

        const data = await res.json();
        setCities(data.cities || []);
      } catch (error) {
        console.error("Error cargando ciudades:", error);
        setSearchError("Error al cargar las ciudades");
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  const swapCities = () => {
    if (origin && destination) {
      const temp = origin;
      setOrigin(destination);
      setDestination(temp);
    } else if (origin && !destination) {
      setDestination(origin);
      setOrigin(null);
    } else if (!origin && destination) {
      setOrigin(destination);
      setDestination(null);
    }
  };

  function getFirstTerminal(stageString: string) {
    if (!stageString) return null;
    const parts = stageString
      .split("||")
      .map((p) => p.trim())
      .filter(Boolean);
    return cleanTerminalName(parts[1] || parts[0]);
  }

  function getLastTerminal(stageString: string) {
    if (!stageString) return null;
    const parts = stageString
      .split("||")
      .map((p) => p.trim())
      .filter(Boolean);
    return cleanTerminalName(parts[parts.length - 1]);
  }

  function cleanTerminalName(str: string) {
    return str.split(",")[0].trim();
  }

  const handleSearch = async () => {
    if (!origin || !destination || !searchDateString) {
      setServices([]);
      setHasSearched(true);
      return;
    }

    setGlobalOrigin(origin.name);
    setGlobalDestination(destination.name);
    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({
        originId: origin.id.toString(),
        destinationId: destination.id.toString(),
        date: searchDateString,
      });

      const res = await fetch(`/api/search?${params}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const mapped =
        data.services?.map((s: any) => {
          return {
            ...s,
            boardingFirst: getFirstTerminal(s.boarding_stages),
            dropoffLast: getLastTerminal(s.dropoff_stages),
          };
        }) ?? [];

      setServices(mapped);
    } catch (error) {
      console.error("Error searching services:", error);
      setSearchError(
        error instanceof Error ? error.message : "Error al buscar servicios"
      );
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (selectedDate: Date | null) => {
    setSelectedDateObject(selectedDate);

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      setSearchDateString(formattedDate);
    } else {
      setSearchDateString("");
    }
  };

  useEffect(() => {
    if (origin && destination && searchDateString) {
      handleSearch();
    }
  }, [searchDateString]);

  const availableDestinations = cities.filter((city) => city.id !== origin?.id);
  const isSearchDisabled =
    !origin || !destination || !searchDateString || isLoading;
  const isSwapDisabled = !origin && !destination;

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Busca tu Viaje</h1>
          <p className="text-lg text-muted-foreground">
            Encuentra los mejores servicios de buses para tu destino
          </p>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Buscar Servicios de Buses
            </CardTitle>
            <CardDescription>
              Encuentra y reserva servicios de buses entre ciudades
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_1fr] items-end">
              {/* ORIGEN */}
              <div className="space-y-2">
                <Label htmlFor="origin" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Origen
                </Label>
                <ComboBox
                  items={cities.map((city) => ({
                    label: city.name,
                    value: city.id.toString(),
                  }))}
                  value={origin?.id.toString() || ""}
                  onChange={(value) => {
                    const city = cities.find((c) => c.id.toString() === value);
                    setOrigin(city || null);
                  }}
                  placeholder={
                    isLoadingCities
                      ? "Cargando ciudades..."
                      : "Selecciona origen"
                  }
                  disabled={isLoadingCities}
                />
              </div>

              <div className="flex items-center justify-center h-10">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={swapCities}
                  disabled={isSwapDisabled}
                  className="h-8 w-8 rounded-full border border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/10 transition-all duration-200"
                  title="Intercambiar origen y destino"
                >
                  <ArrowLeftRight className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </Button>
              </div>

              {/* DESTINO */}
              <div className="space-y-2">
                <Label
                  htmlFor="destination"
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-accent" />
                  Destino
                </Label>
                <ComboBox
                  items={availableDestinations.map((city) => ({
                    label: city.name,
                    value: city.id.toString(),
                  }))}
                  value={destination?.id.toString() || ""}
                  onChange={(value) => {
                    const city = cities.find((c) => c.id.toString() === value);
                    setDestination(city || null);
                  }}
                  placeholder="Selecciona destino"
                  disabled={!origin || isLoadingCities}
                />
              </div>

              {/* FECHA */}
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-secondary" />
                  Fecha
                </Label>
                <ModernDatePicker
                  selected={selectedDateObject}
                  onChange={handleDateChange}
                  minDate={todayForMinDate}
                  placeholderText="Seleccionar fecha"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearchDisabled}
              className="w-full mt-6 bg-accent hover:bg-accent/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar Servicios
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        {/* Mensajes de error */}
        {searchError && (
          <Card className="border-2 border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive text-center">
                <p className="font-medium">Error en la búsqueda</p>
                <p className="text-sm">{searchError}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Resultados de búsqueda */}
        {hasSearched && !searchError && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              {isLoading
                ? "Buscando servicios..."
                : services.length > 0
                ? `${services.length} servicio${
                    services.length > 1 ? "s" : ""
                  } disponible${services.length > 1 ? "s" : ""}`
                : "No se encontraron servicios disponibles"}
            </h2>

            {!isLoading && services.length > 0 && (
              <div className="grid gap-4">
                {services.map((service, index) => (
                  <BusServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}

            {!isLoading && services.length === 0 && hasSearched && (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No hay servicios disponibles para esta ruta y fecha
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Intenta con otra combinación de origen, destino y fecha
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
