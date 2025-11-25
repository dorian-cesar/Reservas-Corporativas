"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Users, BarChart } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onLogout?: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: "Inicio", href: "/" },
    { name: "Reservas", href: "/bookings" },
  ];

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    } else {
      router.push("/login");
    }
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 left-0 right-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/pullman-logo-32x32.png"
              alt="Logo Pullman"
              width={32}
              height={32}
              className="object-contain"
            />
            <div>
              <h1 className="text-xl font-bold">Pullman Bus</h1>
              <p className="text-sm text-muted-foreground">
                Reservas Corporativas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">
                {user?.role === "user" && "Usuario"}
                {user?.role === "admin" && "Controlador"}
                {user?.role === "superuser" && "Super Usuario"}
                {user?.companyName && ` - ${user.companyName}`}
              </p>
            </div>

            <div className="flex gap-2">
              {user?.role === "admin" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push("/controller")}
                  className="transition-all hover:scale-105"
                >
                  <Users className="h-4 w-4" />
                </Button>
              )}

              {user?.role === "superuser" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push("/admin")}
                  className="transition-all hover:scale-105"
                >
                  <BarChart className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="transition-all hover:scale-105 bg-transparent"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <nav className="border-t bg-background/80">
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
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50"
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
    </header>
  );
}
