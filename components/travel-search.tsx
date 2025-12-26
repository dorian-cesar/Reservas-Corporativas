"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { BusServiceCard } from "@/components/bus-service-card";
import { useTravel } from "@/components/context/travel-context";
import { useUserStore } from "@/lib/user-store";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { Badge } from "@/components/ui/badge";

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
  travel_date: string;
}

export function TravelSearch() {
  // Estados para la búsqueda
  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [selectedDepartureDate, setSelectedDepartureDate] =
    useState<Date | null>(null);
  const [selectedReturnDate, setSelectedReturnDate] = useState<Date | null>(
    null
  );
  const [departureDateString, setDepartureDateString] = useState("");
  const [returnDateString, setReturnDateString] = useState("");
  const [searchMode, setSearchMode] = useState<"departure" | "return">(
    "departure"
  );

  // Estados para resultados
  const [departureServices, setDepartureServices] = useState<BusService[]>([]);
  const [returnServices, setReturnServices] = useState<BusService[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReturn, setIsLoadingReturn] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Estado para controlar si ya se reservó la ida
  const [departureBooked, setDepartureBooked] = useState(false);

  const { setOrigin: setGlobalOrigin, setDestination: setGlobalDestination } =
    useTravel();
  const user = useUserStore((s) => s.user);
  const loadingUser = useUserStore((s) => s.loading);

  // Ref para trackear las ciudades originales de ida
  const originalCitiesRef = useRef<{
    origin: City | null;
    destination: City | null;
  }>({ origin: null, destination: null });

  const getTodayLocalStart = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const todayForMinDate = useMemo(() => getTodayLocalStart(), []);

  // Determinar si es viaje de ida y vuelta (si hay fecha de vuelta seleccionada)
  const isRoundTrip = selectedReturnDate !== null;

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

  // Guardar ciudades originales cuando se hace búsqueda de ida
  useEffect(() => {
    if (searchMode === "departure" && origin && destination) {
      originalCitiesRef.current = { origin, destination };
      console.log("Ciudades originales guardadas:", {
        origin: origin.name,
        destination: destination.name,
      });
    }
  }, [searchMode, origin, destination]);

  // Escuchar evento de reserva exitosa de ida
  useEffect(() => {
    const handleDepartureBooked = () => {
      setDepartureBooked(true);

      // Si hay fecha de vuelta seleccionada, buscar automáticamente la vuelta
      if (
        selectedReturnDate &&
        originalCitiesRef.current.origin &&
        originalCitiesRef.current.destination
      ) {
        console.log("Reserva de ida exitosa - preparando búsqueda de vuelta");

        // Intercambiar las ciudades para la vuelta usando las ciudades originales
        const { origin: originalOrigin, destination: originalDestination } =
          originalCitiesRef.current;

        console.log("Ciudades originales de ida:", {
          origen: originalOrigin.name,
          destino: originalDestination.name,
        });

        // Para la vuelta: destino de ida → origen de vuelta, origen de ida → destino de vuelta
        setOrigin(originalDestination);
        setDestination(originalOrigin);

        console.log("Ciudades intercambiadas para vuelta:", {
          nuevoOrigen: originalDestination.name,
          nuevoDestino: originalOrigin.name,
        });

        // Cambiar a modo vuelta y buscar inmediatamente
        setSearchMode("return");
        setHasSearched(false);
        setReturnServices([]);

        // Buscar automáticamente la vuelta con las ciudades intercambiadas
        if (returnDateString) {
          console.log("Buscando vuelta automáticamente con:", {
            origen: originalDestination.name,
            destino: originalOrigin.name,
            fecha: returnDateString,
          });

          // Llamar a búsqueda específica para vuelta
          handleReturnSearch(originalDestination, originalOrigin);
        } else {
          console.log("No hay fecha de vuelta para buscar automáticamente");
        }
      }
    };

    window.addEventListener("departureBooked", handleDepartureBooked);

    return () => {
      window.removeEventListener("departureBooked", handleDepartureBooked);
    };
  }, [selectedReturnDate, returnDateString]);

  // Escuchar evento para continuar con la vuelta (desde el modal de éxito)
  useEffect(() => {
    const handleContinueToReturn = () => {
      setDepartureBooked(true);

      // Intercambiar las ciudades para la vuelta usando las ciudades originales
      if (
        originalCitiesRef.current.origin &&
        originalCitiesRef.current.destination
      ) {
        const { origin: originalOrigin, destination: originalDestination } =
          originalCitiesRef.current;

        console.log("Continuando a vuelta - intercambiando ciudades:", {
          originalOrigin: originalOrigin.name,
          originalDestination: originalDestination.name,
        });

        setOrigin(originalDestination);
        setDestination(originalOrigin);
      }

      setSearchMode("return");
      setDepartureServices([]);
      setHasSearched(false);
      setReturnServices([]);

      // Si hay fecha de vuelta, buscar automáticamente
      if (
        returnDateString &&
        originalCitiesRef.current.origin &&
        originalCitiesRef.current.destination
      ) {
        const { origin: originalOrigin, destination: originalDestination } =
          originalCitiesRef.current;
        console.log("Buscando vuelta desde continueToReturn");
        handleReturnSearch(originalDestination, originalOrigin);
      }
    };

    window.addEventListener("continueToReturn", handleContinueToReturn);

    return () => {
      window.removeEventListener("continueToReturn", handleContinueToReturn);
    };
  }, [returnDateString]);

  // Función específica para buscar vuelta
  const handleReturnSearch = async (
    returnOrigin: City,
    returnDestination: City
  ) => {
    console.log("handleReturnSearch llamado:", {
      origen: returnOrigin.name,
      destino: returnDestination.name,
      fecha: returnDateString,
    });

    if (!returnOrigin || !returnDestination || !returnDateString) {
      console.log("Faltan datos para búsqueda de vuelta");
      setReturnServices([]);
      setHasSearched(true);
      return;
    }

    setIsLoadingReturn(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      console.log("Realizando búsqueda de vuelta en API:", {
        origen: returnOrigin.name,
        destino: returnDestination.name,
        origenId: returnOrigin.id,
        destinoId: returnDestination.id,
        fecha: returnDateString,
      });

      const params = new URLSearchParams({
        originId: returnOrigin.id.toString(),
        destinationId: returnDestination.id.toString(),
        date: returnDateString,
      });

      const url = `/api/search?${params}`;
      console.log("URL de búsqueda de vuelta:", url);

      const res = await fetch(url);

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

      setReturnServices(mapped);
      console.log("Servicios de vuelta encontrados:", mapped.length);
    } catch (error) {
      console.error("Error searching return services:", error);
      setSearchError(
        error instanceof Error
          ? error.message
          : "Error al buscar servicios de vuelta"
      );
      setReturnServices([]);
    } finally {
      setIsLoadingReturn(false);
    }
  };

  // Función para intercambiar ciudades visualmente (swap del botón)
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
    console.log("handleSearch llamado en modo:", searchMode);

    // Validaciones según el modo de búsqueda
    if (searchMode === "departure") {
      if (!origin || !destination || !departureDateString) {
        console.log("Faltan datos para búsqueda de ida");
        setDepartureServices([]);
        setHasSearched(true);
        return;
      }
    } else {
      if (!origin || !destination || !returnDateString) {
        console.log("Faltan datos para búsqueda de vuelta");
        setReturnServices([]);
        setHasSearched(true);
        return;
      }
    }

    // Establecer loading según el modo
    if (searchMode === "departure") {
      setIsLoading(true);
    } else {
      setIsLoadingReturn(true);
    }

    setHasSearched(true);
    setSearchError(null);

    try {
      const searchOrigin = origin;
      const searchDestination = destination;
      const searchDate =
        searchMode === "departure" ? departureDateString : returnDateString;

      if (!searchOrigin || !searchDestination) {
        throw new Error("Ciudades no definidas");
      }

      console.log("Realizando búsqueda en API:", {
        mode: searchMode,
        origen: searchOrigin.name,
        destino: searchDestination.name,
        origenId: searchOrigin.id,
        destinoId: searchDestination.id,
        fecha: searchDate,
      });

      // Solo establecer global cuando es búsqueda de ida
      if (searchMode === "departure") {
        setGlobalOrigin(searchOrigin.name);
        setGlobalDestination(searchDestination.name);
      }

      const params = new URLSearchParams({
        originId: searchOrigin.id.toString(),
        destinationId: searchDestination.id.toString(),
        date: searchDate,
      });

      const url = `/api/search?${params}`;
      console.log("URL de búsqueda:", url);

      const res = await fetch(url);

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

      console.log("services:", mapped);

      if (searchMode === "departure") {
        setDepartureServices(mapped);
        console.log("Servicios de ida encontrados:", mapped.length);
      } else {
        setReturnServices(mapped);
        console.log("Servicios de vuelta encontrados:", mapped.length);
      }
    } catch (error) {
      console.error("Error searching services:", error);
      setSearchError(
        error instanceof Error ? error.message : "Error al buscar servicios"
      );

      if (searchMode === "departure") {
        setDepartureServices([]);
      } else {
        setReturnServices([]);
      }
    } finally {
      if (searchMode === "departure") {
        setIsLoading(false);
      } else {
        setIsLoadingReturn(false);
      }
    }
  };

  const handleDepartureDateChange = (selectedDate: Date | null) => {
    setSelectedDepartureDate(selectedDate);

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      setDepartureDateString(formattedDate);
    } else {
      setDepartureDateString("");
    }
  };

  const handleReturnDateChange = (selectedDate: Date | null) => {
    setSelectedReturnDate(selectedDate);

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      setReturnDateString(formattedDate);
    } else {
      setReturnDateString("");
      // Si se borra la fecha de vuelta, limpiar estado de vuelta
      if (searchMode === "return") {
        setSearchMode("departure");
        setDepartureBooked(false);
        setReturnServices([]);
      }
    }
  };

  const handleSwitchToReturnSearch = () => {
    console.log("Usuario clickeó 'Buscar Vuelta'");

    // Intercambiar las ciudades para la vuelta usando las ciudades originales
    if (
      originalCitiesRef.current.origin &&
      originalCitiesRef.current.destination
    ) {
      const { origin: originalOrigin, destination: originalDestination } =
        originalCitiesRef.current;

      console.log("Intercambiando ciudades para búsqueda manual de vuelta:", {
        ida: `${originalOrigin.name} → ${originalDestination.name}`,
        vuelta: `${originalDestination.name} → ${originalOrigin.name}`,
      });

      setOrigin(originalDestination);
      setDestination(originalOrigin);
    }

    setSearchMode("return");
    setReturnServices([]);
    setHasSearched(false);

    // Si hay fecha de vuelta, buscar automáticamente
    if (
      returnDateString &&
      originalCitiesRef.current.origin &&
      originalCitiesRef.current.destination
    ) {
      const { origin: originalOrigin, destination: originalDestination } =
        originalCitiesRef.current;
      console.log("Buscando vuelta manualmente");
      handleReturnSearch(originalDestination, originalOrigin);
    }
  };

  const handleSwitchToDepartureSearch = () => {
    console.log("Volviendo a búsqueda de ida");

    // Restaurar las ciudades originales
    if (
      originalCitiesRef.current.origin &&
      originalCitiesRef.current.destination
    ) {
      setOrigin(originalCitiesRef.current.origin);
      setDestination(originalCitiesRef.current.destination);
    }

    setSearchMode("departure");
    setDepartureServices([]);
    setHasSearched(false);
    setDepartureBooked(false);
  };

  const availableDestinations = cities.filter((city) => city.id !== origin?.id);

  const isSearchDisabled =
    searchMode === "departure"
      ? !origin || !destination || !departureDateString || isLoading
      : !origin || !destination || !returnDateString || isLoadingReturn;

  const isSwapDisabled = !origin && !destination;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // Determinar qué servicios mostrar
  const currentServices =
    searchMode === "departure" ? departureServices : returnServices;
  const currentLoading =
    searchMode === "departure" ? isLoading : isLoadingReturn;

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container 2xl:max-w-[1300px] mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Busca tu Viaje</h1>
          <p className="text-lg text-muted-foreground">
            Encuentra los mejores servicios de buses para tu destino
          </p>
        </div>

        {/* Banner de progreso si es ida y vuelta */}
        {isRoundTrip && (
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Viaje de Ida y Vuelta
                </h3>
                <p className="text-sm text-blue-600">
                  {searchMode === "departure"
                    ? "Paso 1: Busca y reserva tu viaje de ida"
                    : "Paso 2: Busca y reserva tu viaje de vuelta"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      searchMode === "departure"
                        ? "bg-blue-600 text-white"
                        : departureBooked
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {departureBooked ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      "1"
                    )}
                  </div>
                  <span className="text-sm font-medium">Ida</span>
                </div>
                <div className="h-1 w-8 bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      searchMode === "return"
                        ? "bg-blue-600 text-white"
                        : departureBooked
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {searchMode === "return"
                      ? "2"
                      : departureBooked
                      ? "2"
                      : "2"}
                  </div>
                  <span className="text-sm font-medium">Vuelta</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Buscar Servicios de Buses
              {isRoundTrip && (
                <Badge variant="outline" className="ml-2">
                  {searchMode === "departure" ? "Ida" : "Vuelta"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {searchMode === "departure"
                ? `Busca y reserva tu viaje de ida: ${
                    origin?.name || "Origen"
                  } → ${destination?.name || "Destino"}`
                : `Busca tu viaje de vuelta: ${origin?.name || "Origen"} → ${
                    destination?.name || "Destino"
                  }`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_1fr_1fr] items-end">
              {/* ORIGEN */}
              <div className="space-y-2">
                <Label htmlFor="origin" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {searchMode === "departure" ? "Origen" : "Origen (vuelta)"}
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
                      : searchMode === "departure"
                      ? "Selecciona origen"
                      : "Selecciona origen de vuelta"
                  }
                  disabled={
                    isLoadingCities ||
                    (searchMode === "return" && !departureBooked)
                  }
                />
              </div>

              <div className="flex items-center justify-center h-10">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={swapCities}
                  disabled={
                    isSwapDisabled ||
                    (searchMode === "return" && !departureBooked)
                  }
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
                  {searchMode === "departure" ? "Destino" : "Destino (vuelta)"}
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
                  placeholder={
                    searchMode === "departure"
                      ? "Selecciona destino"
                      : "Selecciona destino de vuelta"
                  }
                  disabled={
                    !origin ||
                    isLoadingCities ||
                    (searchMode === "return" && !departureBooked)
                  }
                />
              </div>

              {/* FECHA IDA */}
              <div className="space-y-2">
                <Label
                  htmlFor="departure-date"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-secondary" />
                  Fecha Ida
                </Label>
                <ModernDatePicker
                  selected={selectedDepartureDate}
                  onChange={handleDepartureDateChange}
                  minDate={todayForMinDate}
                  placeholderText="Seleccionar fecha ida"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* FECHA VUELTA (OPCIONAL) */}
              <div className="space-y-2">
                <Label
                  htmlFor="return-date"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-secondary" />
                  Fecha Vuelta (opcional)
                </Label>
                <ModernDatePicker
                  selected={selectedReturnDate}
                  onChange={handleReturnDateChange}
                  minDate={selectedDepartureDate || todayForMinDate}
                  placeholderText="Seleccionar fecha vuelta"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
            </div>

            {/* Botones de acción según el modo */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSearch}
                disabled={isSearchDisabled}
                className="flex-1 bg-accent hover:bg-accent/90"
              >
                {currentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    {searchMode === "departure"
                      ? "Buscar Servicios de Ida"
                      : "Buscar Servicios de Vuelta"}
                  </>
                )}
              </Button>

              {isRoundTrip && departureBooked && searchMode === "departure" && (
                <Button
                  onClick={handleSwitchToReturnSearch}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Buscar Vuelta
                </Button>
              )}

              {searchMode === "return" && (
                <Button
                  onClick={handleSwitchToDepartureSearch}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowRightLeft className="h-4 w-4 rotate-180" />
                  Volver a Ida
                </Button>
              )}
            </div>
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
          <div className="space-y-8">
            {/* Resultados actuales */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg sm:text-2xl font-bold flex flex-wrap items-center gap-2">
                  {searchMode === "departure" ? (
                    <>
                      <ArrowRightLeft className="h-5 w-5 text-primary shrink-0" />
                      <span className="wrap-break-words">
                        Viaje de Ida: {origin?.name} → {destination?.name}
                      </span>

                      {departureDateString && (
                        <span className="text-sm sm:text-lg font-normal text-muted-foreground">
                          ({formatDate(departureDateString)})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-5 w-5 text-primary rotate-180 shrink-0" />
                      <span className="wrap-break-words">
                        Viaje de Vuelta: {origin?.name} → {destination?.name}
                      </span>

                      {returnDateString && (
                        <span className="text-sm sm:text-lg font-normal text-muted-foreground">
                          ({formatDate(returnDateString)})
                        </span>
                      )}
                    </>
                  )}
                </h2>

                <Badge
                  variant="outline"
                  className="text-sm self-start sm:self-auto whitespace-nowrap"
                >
                  {currentLoading
                    ? "Buscando..."
                    : currentServices.length > 0
                    ? `${currentServices.length} servicio${
                        currentServices.length > 1 ? "s" : ""
                      } disponible${currentServices.length > 1 ? "s" : ""}`
                    : "No hay servicios"}
                </Badge>
              </div>

              {!currentLoading && currentServices.length > 0 && (
                <div className="grid gap-4">
                  {currentServices.map((service, index) => (
                    <BusServiceCard
                      key={`${searchMode}-${service.id}`}
                      service={service}
                      tripType={searchMode}
                    />
                  ))}
                </div>
              )}

              {!currentLoading && currentServices.length === 0 && (
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      {searchMode === "departure"
                        ? "No hay servicios disponibles para esta ruta y fecha de ida"
                        : "No hay servicios disponibles para esta ruta y fecha de vuelta"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Intenta con otra combinación de origen, destino y fecha
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Mensaje para continuar con la vuelta si es ida y vuelta */}
            {isRoundTrip &&
              searchMode === "departure" &&
              departureServices.length > 0 &&
              !departureBooked && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-blue-800">
                          ¿Listo para continuar?
                        </h3>
                        <p className="text-sm text-blue-600">
                          Primero selecciona y reserva un servicio de ida, luego
                          podrás buscar tu viaje de vuelta
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        Paso 1 de 2
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
