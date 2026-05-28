import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "@/components/client-layout";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Reservas Corporativas - Pullman Bus",
  description:
    "Plataforma integral para gestionar viajes y reservas de tu empresa. Control presupuestario, reportes en tiempo real y beneficios exclusivos.",
  keywords:
    "transporte buses, pullman, reservas corporativas, viajes corporativos, empresas, pasajes, buses premium",
  authors: [{ name: "Pullman Bus" }],
  openGraph: {
    title: "Reservas Corporativas - Pullman Bus",
    description:
      "Tu socio confiable en transporte corporativo. Seguridad, comodidad y control en cada viaje.",
    type: "website",
    locale: "es_CL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reservas Corporativas - Pullman Bus",
    description:
      "Tu socio confiable en transporte corporativo. Seguridad, comodidad y control en cada viaje.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
