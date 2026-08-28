"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import {
  Building2,
  Ticket,
  DollarSign,
  Users,
  CreditCard,
  Building,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalEmpresas: number;
  totalEmpresasActivas?: number;
  totalCuentasActivas?: number;
  totalCentrosCosto: number;
  totalReservasConfirmadas: number;
  totalUsuariosActivos: number;
  montoBoletos: number;
}

export function AdminStats() {
  const { token, user } = useAuth.getState();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data: DashboardStats = await response.json();
        setStats(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar estadísticas",
        );
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const displayStats = [
    {
      title: "Total Empresas",
      value: stats?.totalEmpresas || 0,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      formatter: (value: number) => value.toLocaleString("es-CL"),
    },
    {
      title: "Empresas Activas",
      value: stats?.totalEmpresasActivas ?? 0,
      icon: Building,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      formatter: (value: number) => value.toLocaleString("es-CL"),
    },
    {
      title: "Cuentas Activas",
      value: stats?.totalCuentasActivas ?? 0,
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      formatter: (value: number) => value.toLocaleString("es-CL"),
    },
    {
      title: "Total Reservas",
      value: stats?.totalReservasConfirmadas || 0,
      icon: Ticket,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      formatter: (value: number) => value.toLocaleString("es-CL"),
    },
    {
      title: "Usuarios Activos",
      value: stats?.totalUsuariosActivos || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      formatter: (value: number) => value.toLocaleString("es-CL"),
    },
    {
      title: "Monto Boletos",
      value: stats?.montoBoletos || 0,
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
      formatter: (value: number) => `$${value.toLocaleString("es-CL")}`,
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              Cargando...
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-6">
        <Card className="col-span-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {displayStats.map((stat, index) => (
        <Card
          key={stat.title}
          className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-top-4"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.formatter(stat.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
