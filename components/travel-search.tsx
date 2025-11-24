"use client";

import { useState, useEffect } from "react";
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
import { Search, MapPin, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { ROUTES, TRIPS, type Trip, type Route } from "@/lib/mock-data";
import { TripCard } from "@/components/trip-card";

export function TravelSearch() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [searchResults, setSearchResults] = useState<
    (Trip & { route: Route })[]
  >([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [cities, setCities] = useState<
    {
      id: number;
      name: string;
      origin_count: number;
      destination_count: number;
    }[]
  >([]);

  const [isLoadingCities, setIsLoadingCities] = useState(true);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await fetch("/api/cities", { cache: "no-store" });
        const data = await res.json();
        setCities(data.cities || []);
      } catch (error) {
        console.error("Error cargando ciudades:", error);
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  const handleSearch = () => {
    setHasSearched(true);

    if (!origin || !destination || !date) {
      setSearchResults([]);
      return;
    }

    const route = ROUTES.find(
      (r) => r.origin === origin && r.destination === destination
    );

    if (!route) {
      setSearchResults([]);
      return;
    }

    const trips = TRIPS.filter(
      (t) => t.routeId === route.id && t.date === date
    ).map((trip) => ({
      ...trip,
      route,
    }));

    setSearchResults(trips);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Viajes Disponibles
          </CardTitle>
          <CardDescription>
            Ingresa los detalles de tu viaje para ver las opciones disponibles
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* ORIGEN */}
            <div className="space-y-2">
              <Label htmlFor="origin" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Origen
              </Label>

              <ComboBox
                items={cities.map((c, i) => ({
                  label: c.name,
                  value: `${c.name}-${i}`,
                }))}
                value={origin}
                onChange={setOrigin}
                placeholder={
                  isLoadingCities ? "Cargando..." : "Selecciona ciudad"
                }
              />
            </div>

            {/* DESTINO */}
            <div className="space-y-2">
              <Label htmlFor="destination" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                Destino
              </Label>

              <ComboBox
                items={cities
                  .filter((c) => c.name !== origin)
                  .map((c, i) => ({ label: c.name, value: `${c.name}-${i}` }))}
                value={destination}
                onChange={setDestination}
                placeholder={
                  isLoadingCities ? "Cargando..." : "Selecciona ciudad"
                }
              />
            </div>

            {/* FECHA */}
            {/* <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-secondary" />
                Fecha
              </Label>

              <DatePicker
                date={date ? new Date(date) : undefined}
                onChange={(d) =>
                  setDate(d ? d.toISOString().split("T")[0] : "")
                }
              />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-secondary" />
                Fecha
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="transition-all duration-200 hover:border-primary"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            className="w-full mt-6 bg-accent hover:bg-accent/90"
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar Viajes
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-4">
            {searchResults.length > 0
              ? `${searchResults.length} viaje${
                  searchResults.length > 1 ? "s" : ""
                } disponible${searchResults.length > 1 ? "s" : ""}`
              : "No se encontraron viajes disponibles"}
          </h2>

          {searchResults.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.map((trip, index) => (
                <div
                  key={trip.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <TripCard trip={trip} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No hay viajes disponibles para esta ruta y fecha
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
  );
}
