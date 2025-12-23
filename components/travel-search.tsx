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
  const [isRoundTrip, setIsRoundTrip] = useState(false);
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

  // Estado para controlar si ya se intercambiaron las ciudades para la vuelta
  const [citiesSwappedForReturn, setCitiesSwappedForReturn] = useState(false);

  const { setOrigin: setGlobalOrigin, setDestination: setGlobalDestination } =
    useTravel();
  const user = useUserStore((s) => s.user);
  const loadingUser = useUserStore((s) => s.loading);

  // Refs para trackear las ciudades originales de ida
  const originalDepartureCities = useRef<{
    origin: City | null;
    destination: City | null;
  }>({
    origin: null,
    destination: null,
  });

  // Ref para controlar limpieza
  const cleanupDone = useRef(false);

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

  // Guardar las ciudades originales de ida cuando se hace la búsqueda
  useEffect(() => {
    if (
      searchMode === "departure" &&
      origin &&
      destination &&
      !originalDepartureCities.current.origin
    ) {
      originalDepartureCities.current = {
        origin: origin,
        destination: destination,
      };
    }
  }, [searchMode, origin, destination]);

  // Efecto para limpiar reservas antiguas cuando se inicia un nuevo viaje
  useEffect(() => {
    // Limpiar reservas cuando:
    // 1. Se carga el componente por primera vez
    // 2. Se cambia de modo de búsqueda (departure/return)
    // 3. Se desactiva ida y vuelta

    if (!cleanupDone.current) {
      // Limpiar reservas antiguas al cargar el componente
      localStorage.removeItem("completedBookings");
      cleanupDone.current = true;
      console.log("Reservas limpiadas al cargar componente");
    }

    // También limpiar cuando se desactiva ida y vuelta
    const handleBeforeUnload = () => {
      localStorage.removeItem("completedBookings");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Efecto para limpiar cuando se cambia el modo de búsqueda
  useEffect(() => {
    // Cuando cambiamos a modo "departure" (nuevo viaje), limpiar reservas
    if (searchMode === "departure" && hasSearched) {
      // Solo limpiar si no hay reserva de ida confirmada aún
      if (!departureBooked) {
        localStorage.removeItem("completedBookings");
        console.log("Reservas limpiadas al iniciar nueva búsqueda");
      }
    }
  }, [searchMode, hasSearched, departureBooked]);

  // Escuchar evento de reserva exitosa de ida
  useEffect(() => {
    const handleDepartureBooked = () => {
      setDepartureBooked(true);
    };

    window.addEventListener("departureBooked", handleDepartureBooked);

    return () => {
      window.removeEventListener("departureBooked", handleDepartureBooked);
    };
  }, []);

  // Escuchar evento para continuar con la vuelta (desde el modal de éxito)
  useEffect(() => {
    const handleContinueToReturn = () => {
      setDepartureBooked(true);

      // Intercambiar automáticamente las ciudades al pasar a vuelta
      if (origin && destination) {
        swapCitiesForReturn();
      }

      setSearchMode("return");
      setDepartureServices([]);
      setHasSearched(false);
    };

    window.addEventListener("continueToReturn", handleContinueToReturn);

    return () => {
      window.removeEventListener("continueToReturn", handleContinueToReturn);
    };
  }, [origin, destination]);

  // Función especial para intercambiar ciudades cuando se pasa a vuelta
  const swapCitiesForReturn = () => {
    if (origin && destination) {
      // Intercambiar las ciudades
      const temp = origin;
      setOrigin(destination);
      setDestination(temp);
      setCitiesSwappedForReturn(true);
    }
  };

  // Función para restaurar las ciudades originales de ida
  const restoreDepartureCities = () => {
    if (
      originalDepartureCities.current.origin &&
      originalDepartureCities.current.destination
    ) {
      setOrigin(originalDepartureCities.current.origin);
      setDestination(originalDepartureCities.current.destination);
      setCitiesSwappedForReturn(false);
    }
  };

  const swapCities = () => {
    if (origin && destination) {
      const temp = origin;
      setOrigin(destination);
      setDestination(temp);

      // Actualizar el estado de intercambio
      if (searchMode === "return") {
        setCitiesSwappedForReturn(!citiesSwappedForReturn);
      }

      // Si ya hay resultados, intercambiar también
      if (hasSearched && searchMode === "departure") {
        setDepartureServices((prev) =>
          prev.map((service) => ({
            ...service,
            origin_id: service.destination_id,
            destination_id: service.origin_id,
            boardingFirst: service.dropoffLast,
            dropoffLast: service.boardingFirst,
          }))
        );
      } else if (hasSearched && searchMode === "return") {
        setReturnServices((prev) =>
          prev.map((service) => ({
            ...service,
            origin_id: service.destination_id,
            destination_id: service.origin_id,
            boardingFirst: service.dropoffLast,
            dropoffLast: service.boardingFirst,
          }))
        );
      }
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
    // Validaciones según el modo de búsqueda
    if (searchMode === "departure") {
      if (!origin || !destination || !departureDateString) {
        setDepartureServices([]);
        setHasSearched(true);
        return;
      }
    } else {
      if (!origin || !destination || !returnDateString) {
        setReturnServices([]);
        setHasSearched(true);
        return;
      }
    }

    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      // IMPORTANTE: Usar las ciudades actuales del estado
      const searchOrigin = origin;
      const searchDestination = destination;
      const searchDate =
        searchMode === "departure" ? departureDateString : returnDateString;

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

      if (searchMode === "departure") {
        setDepartureServices(mapped);
      } else {
        setReturnServices(mapped);
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
      setIsLoading(false);
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
    }
  };

  const handleRoundTripChange = (checked: boolean) => {
    setIsRoundTrip(checked);
    if (!checked) {
      setSelectedReturnDate(null);
      setReturnDateString("");
      setSearchMode("departure");
      setDepartureBooked(false);
      setReturnServices([]);
      setCitiesSwappedForReturn(false);

      // Restaurar las ciudades originales de ida
      restoreDepartureCities();

      // Limpiar reservas cuando se desactiva ida y vuelta
      localStorage.removeItem("completedBookings");
      console.log("Reservas limpiadas al desactivar ida y vuelta");
    } else {
      // Cuando se activa ida y vuelta, también limpiar reservas
      localStorage.removeItem("completedBookings");
      console.log("Reservas limpiadas al activar ida y vuelta");
    }
  };

  const handleSwitchToReturnSearch = () => {
    if (isRoundTrip && departureBooked) {
      // Intercambiar automáticamente las ciudades al pasar a vuelta
      if (origin && destination) {
        swapCitiesForReturn();
      }
      setSearchMode("return");
      setReturnServices([]);
      setHasSearched(false);
    }
  };

  const handleSwitchToDepartureSearch = () => {
    // Restaurar las ciudades originales de ida
    restoreDepartureCities();

    setSearchMode("departure");
    setDepartureServices([]);
    setHasSearched(false);
  };

  const availableDestinations = cities.filter((city) => city.id !== origin?.id);

  const isSearchDisabled =
    searchMode === "departure"
      ? !origin || !destination || !departureDateString || isLoading
      : !origin || !destination || !returnDateString || isLoading;

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
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Busca tu Viaje</h1>
          <p className="text-lg text-muted-foreground">
            Encuentra los mejores servicios de buses para tu destino
          </p>
        </div>

        {/* Banner de progreso si es ida y vuelta */}
        {isRoundTrip && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
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
                ? "Busca y reserva tu viaje de ida"
                : `Busca y reserva tu viaje de vuelta: ${
                    origin?.name || "Origen"
                  } → ${destination?.name || "Destino"}`}
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
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-secondary" />
                  {searchMode === "departure" ? "Fecha Ida" : "Fecha Vuelta"}
                </Label>
                <ModernDatePicker
                  selected={
                    searchMode === "departure"
                      ? selectedDepartureDate
                      : selectedReturnDate
                  }
                  onChange={
                    searchMode === "departure"
                      ? handleDepartureDateChange
                      : handleReturnDateChange
                  }
                  minDate={
                    searchMode === "departure"
                      ? todayForMinDate
                      : selectedDepartureDate || todayForMinDate
                  }
                  placeholderText={
                    searchMode === "departure"
                      ? "Seleccionar fecha ida"
                      : "Seleccionar fecha vuelta"
                  }
                  disabled={
                    isLoading || (searchMode === "return" && !departureBooked)
                  }
                  className="w-full"
                />
              </div>

              {/* CHECKBOX IDA Y VUELTA */}
              <div className="space-y-2">
                <Label htmlFor="roundtrip" className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-secondary" />
                  Tipo de Viaje
                </Label>
                <div className="flex items-center space-x-2 h-10">
                  <input
                    type="checkbox"
                    id="roundtrip"
                    checked={isRoundTrip}
                    onChange={(e) => handleRoundTripChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="roundtrip"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ida y vuelta
                  </label>
                </div>
              </div>
            </div>

            {/* Botones de acción según el modo */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSearch}
                disabled={isSearchDisabled}
                className="flex-1 bg-accent hover:bg-accent/90"
              >
                {isLoading ? (
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

              {isRoundTrip && searchMode === "return" && (
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {searchMode === "departure" ? (
                    <>
                      <ArrowRightLeft className="h-5 w-5 text-primary" />
                      Viaje de Ida: {origin?.name} → {destination?.name}
                      {departureDateString && (
                        <span className="text-lg font-normal text-muted-foreground ml-2">
                          ({formatDate(departureDateString)})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-5 w-5 text-primary rotate-180" />
                      Viaje de Vuelta: {origin?.name} → {destination?.name}
                      {returnDateString && (
                        <span className="text-lg font-normal text-muted-foreground ml-2">
                          ({formatDate(returnDateString)})
                        </span>
                      )}
                    </>
                  )}
                </h2>
                <Badge variant="outline" className="text-sm">
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

            {/* Mensaje si ya se reservó la ida pero no se ha buscado la vuelta */}
            {isRoundTrip && departureBooked && searchMode === "departure" && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-green-800">
                        ¡Ida reservada exitosamente!
                      </h3>
                      <p className="text-sm text-green-600">
                        Ahora puedes buscar y reservar tu viaje de vuelta usando
                        el botón "Buscar Vuelta"
                      </p>
                    </div>
                    <Button
                      onClick={handleSwitchToReturnSearch}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Buscar Vuelta
                    </Button>
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
