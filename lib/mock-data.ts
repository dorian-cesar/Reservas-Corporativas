export interface Company {
  id: string;
  name: string;
  contactEmail: string;
  activeUsers: number;
  totalBookings: number;
  surchargePercentage: number;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  duration: string;
  price: number;
}

export interface Trip {
  id: string;
  routeId: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
}

export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userEmail: string;
  companyId: string;
  companyName: string;
  seatNumber: string;
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  price: number;
  status: "confirmed" | "cancelled";
  bookedAt: string;
}

export const COMPANIES: Company[] = [
  {
    id: "emp1",
    name: "Tecnología Chile S.A.",
    contactEmail: "controller@tecnologiachile.cl",
    activeUsers: 45,
    totalBookings: 128,
    surchargePercentage: 15,
  },
  {
    id: "emp2",
    name: "Logística Andina Corp.",
    contactEmail: "controller@logisticaandina.cl",
    activeUsers: 32,
    totalBookings: 96,
    surchargePercentage: 12,
  },
  {
    id: "emp3",
    name: "Consultores del Pacífico",
    contactEmail: "controller@consultorespacifico.cl",
    activeUsers: 28,
    totalBookings: 74,
    surchargePercentage: 10,
  },
];

export const ROUTES: Route[] = [
  {
    id: "r1",
    origin: "Santiago",
    destination: "Valparaíso",
    duration: "1h 30m",
    price: 8500,
  },
  {
    id: "r2",
    origin: "Santiago",
    destination: "Concepción",
    duration: "5h 15m",
    price: 12000,
  },
  {
    id: "r3",
    origin: "Santiago",
    destination: "La Serena",
    duration: "4h 20m",
    price: 10500,
  },
  {
    id: "r4",
    origin: "Valparaíso",
    destination: "Viña del Mar",
    duration: "20m",
    price: 2500,
  },
  {
    id: "r5",
    origin: "Santiago",
    destination: "Mendoza (ARG)",
    duration: "6h 30m",
    price: 15000,
  },
];

export const TRIPS: Trip[] = [
  {
    id: "t1",
    routeId: "r1",
    date: "2025-01-25",
    departureTime: "08:00",
    arrivalTime: "09:30",
    availableSeats: 18,
    totalSeats: 40,
    price: 8500,
  },
  {
    id: "t2",
    routeId: "r1",
    date: "2025-01-25",
    departureTime: "14:00",
    arrivalTime: "15:30",
    availableSeats: 15,
    totalSeats: 40,
    price: 8500,
  },
  {
    id: "t3",
    routeId: "r2",
    date: "2025-01-26",
    departureTime: "22:00",
    arrivalTime: "03:15",
    availableSeats: 22,
    totalSeats: 45,
    price: 12000,
  },
  {
    id: "t4",
    routeId: "r3",
    date: "2025-01-25",
    departureTime: "07:30",
    arrivalTime: "11:50",
    availableSeats: 10,
    totalSeats: 35,
    price: 10500,
  },
  {
    id: "t5",
    routeId: "r5",
    date: "2025-01-27",
    departureTime: "06:00",
    arrivalTime: "12:30",
    availableSeats: 25,
    totalSeats: 50,
    price: 15000,
  },
];

export const BOOKINGS: Booking[] = [
  {
    id: "b1",
    tripId: "t1",
    userId: "1",
    userName: "Usuario Wit",
    userEmail: "user@wit.la",
    companyId: "emp1",
    companyName: "Tecnología Chile S.A.",
    seatNumber: "A12",
    origin: "Santiago",
    destination: "Valparaíso",
    date: "2025-01-25",
    departureTime: "08:00",
    price: 8500,
    status: "confirmed",
    bookedAt: "2025-01-20T10:30:00",
  },
  {
    id: "b2",
    tripId: "t3",
    userId: "2",
    userName: "Usuario Wit",
    userEmail: "user@wit.la",
    companyId: "emp2",
    companyName: "Logística Andina Corp.",
    seatNumber: "B8",
    origin: "Santiago",
    destination: "Concepción",
    date: "2025-01-26",
    departureTime: "22:00",
    price: 12000,
    status: "confirmed",
    bookedAt: "2025-01-19T15:20:00",
  },
  {
    id: "b3",
    tripId: "t4",
    userId: "3",
    userName: "Usuario Wit",
    userEmail: "user@wit.la",
    companyId: "emp3",
    companyName: "Consultores del Pacífico",
    seatNumber: "C15",
    origin: "Santiago",
    destination: "La Serena",
    date: "2025-01-25",
    departureTime: "07:30",
    price: 10500,
    status: "confirmed",
    bookedAt: "2025-01-21T14:15:00",
  },
  {
    id: "b4",
    tripId: "t5",
    userId: "4",
    userName: "Usuario Wit",
    userEmail: "user@wit.la",
    companyId: "emp1",
    companyName: "Tecnología Chile S.A.",
    seatNumber: "D22",
    origin: "Santiago",
    destination: "Mendoza (ARG)",
    date: "2025-01-27",
    departureTime: "06:00",
    price: 15000,
    status: "cancelled",
    bookedAt: "2025-01-18T09:45:00",
  },
  {
    id: "b5",
    tripId: "t2",
    userId: "5",
    userName: "Usuario Wit",
    userEmail: "user@wit.la",
    companyId: "emp2",
    companyName: "Logística Andina Corp.",
    seatNumber: "E7",
    origin: "Santiago",
    destination: "Valparaíso",
    date: "2025-01-25",
    departureTime: "14:00",
    price: 8500,
    status: "confirmed",
    bookedAt: "2025-01-22T16:20:00",
  },
];
