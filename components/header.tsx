"use client";

import { useAuth, useTokenExpiration } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Users, BarChart } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/user-store";

interface HeaderProps {
  onLogout?: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const { user, logout, token } = useAuth();
  const clearUser = useUserStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();

  // arrancar watcher con check cada 30s y force logout si quedan < 15 minutos
  useTokenExpiration(30_000, 15 * 60 * 1000);

  const navigation = [
    { name: "Inicio", href: "/" },
    { name: "Buscar", href: "/portal" },
    { name: "Reservas", href: "/bookings" },
  ];

  const handleLogout = () => {
    logout();
    clearUser();
    if (onLogout) onLogout();
    else router.push("/");
  };

  const allowedRoles = ["user", "subusuario"];
  const showNavigation = allowedRoles.includes(user?.role || "");

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 left-0 right-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <Link href="/">
              <Image
                src="/logo-reservas-corporativas.png"
                alt="Reservas Corporativas"
                width={190}
                height={60}
                className="object-contain hover:scale-102 transition-transform"
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">
                {user?.role === "contralor" && "Controlador"}
                {user?.role === "auditoria" && "Auditoria"}
                {user?.role === "subusuario" && "Usuario"}
                {user?.role === "empresa" && "Empresa"}
                {user?.role === "admin" && "Administrador"}
                {user?.role === "superuser" && "Super Usuario"}
                {user?.role === "admincc" && "AdminCC"}
                {user?.companyName && ` - ${user.companyName}`}
              </p>
            </div>

            <div className="flex gap-2">
              {/* {user?.role === "admin" && (
                <Button variant="outline" size="icon" onClick={() => router.push("/controller")}>
                  <Users className="h-4 w-4" />
                </Button>
              )} */}

              {/* {user?.role === "superuser" && (
                <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
                  <BarChart className="h-4 w-4" />
                </Button>
              )} */}

              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            <div className="border-l border-border pl-4 ml-2">
              <Image
                src="/logo-wit-dark.png"
                alt="WIT Logo"
                width={40}
                height={40}
                className="object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      {showNavigation && (
        <nav className="border-t bg-card/50">
          <div className="container mx-auto px-4">
            <div className="flex justify-center h-10">
              <div className="flex space-x-8">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                        isActive
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50",
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
