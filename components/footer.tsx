"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Code, Heart } from "lucide-react";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const [currentYear, setCurrentYear] = useState<number>(2025);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer
      className={cn("border-t bg-card/50 backdrop-blur-sm mt-auto", className)}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="hidden md:flex items-center">
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="text-sm text-muted-foreground">
              © {currentYear} WIT INNOVACIÓN TECNOLÓGICA
            </div>
          </div>

          <div className="relative w-12 h-12 flex items-center justify-center">
            <Image
              src="/logo-wit-dark.png"
              alt="WIT INNOVACIÓN TECNOLÓGICA"
              width={48}
              height={48}
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
        </div>

        <div className="md:hidden flex flex-col items-center space-y-3">
          <div className="relative w-10 h-10">
            <Image
              src="/logo-wit-dark.png"
              alt="WIT INNOVACIÓN TECNOLÓGICA"
              width={40}
              height={40}
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            © {currentYear} WIT INNOVACIÓN TECNOLÓGICA
          </div>
        </div>
      </div>
    </footer>
  );
}
