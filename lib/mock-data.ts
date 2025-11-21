export interface Company {
  id: string
  name: string
  contactEmail: string
  activeUsers: number
  totalBookings: number
}

export interface Route {
  id: string
  origin: string
  destination: string
  duration: string
  price: number
}

export interface Trip {
  id: string
  routeId: string
  date: string
  departureTime: string
  arrivalTime: string
  availableSeats: number
  totalSeats: number
  price: number
}

export interface Booking {
  id: string
  tripId: string
  userId: string
  userName: string
  userEmail: string
  companyId: string
  companyName: string
  seatNumber: string
  origin: string
  destination: string
  date: string
  departureTime: string
  price: number
  status: "confirmed" | "cancelled"
  bookedAt: string
}

export const COMPANIES: Company[] = [
  {
    id: "emp1",
    name: "Empresa Tecnológica S.A.",
    contactEmail: "controller@empresa1.com",
    activeUsers: 45,
    totalBookings: 128,
  },
  {
    id: "emp2",
    name: "Logística Global Corp.",
    contactEmail: "controller@empresa2.com",
    activeUsers: 32,
    totalBookings: 96,
  },
  {
    id: "emp3",
    name: "Consultoría Internacional",
    contactEmail: "controller@empresa3.com",
    activeUsers: 28,
    totalBookings: 74,
  },
]

export const ROUTES: Route[] = [
  {
    id: "r1",
    origin: "Buenos Aires",
    destination: "Córdoba",
    duration: "9h 30m",
    price: 8500,
  },
  {
    id: "r2",
    origin: "Buenos Aires",
    destination: "Mendoza",
    duration: "12h 15m",
    price: 12000,
  },
  {
    id: "r3",
    origin: "Buenos Aires",
    destination: "Rosario",
    duration: "4h 20m",
    price: 5500,
  },
  {
    id: "r4",
    origin: "Córdoba",
    destination: "Mendoza",
    duration: "6h 45m",
    price: 7800,
  },
  {
    id: "r5",
    origin: "Rosario",
    destination: "Córdoba",
    duration: "5h 30m",
    price: 6200,
  },
]

export const TRIPS: Trip[] = [
  {
    id: "t1",
    routeId: "r1",
    date: "2025-01-25",
    departureTime: "08:00",
    arrivalTime: "17:30",
    availableSeats: 12,
    totalSeats: 40,
    price: 8500,
  },
  {
    id: "t2",
    routeId: "r1",
    date: "2025-01-25",
    departureTime: "14:00",
    arrivalTime: "23:30",
    availableSeats: 8,
    totalSeats: 40,
    price: 8500,
  },
  {
    id: "t3",
    routeId: "r2",
    date: "2025-01-26",
    departureTime: "10:00",
    arrivalTime: "22:15",
    availableSeats: 15,
    totalSeats: 45,
    price: 12000,
  },
  {
    id: "t4",
    routeId: "r3",
    date: "2025-01-25",
    departureTime: "09:30",
    arrivalTime: "13:50",
    availableSeats: 20,
    totalSeats: 35,
    price: 5500,
  },
  {
    id: "t5",
    routeId: "r4",
    date: "2025-01-27",
    departureTime: "07:00",
    arrivalTime: "13:45",
    availableSeats: 10,
    totalSeats: 40,
    price: 7800,
  },
]

export const BOOKINGS: Booking[] = [
  {
    id: "b1",
    tripId: "t1",
    userId: "1",
    userName: "Juan Pérez",
    userEmail: "user@empresa1.com",
    companyId: "emp1",
    companyName: "Empresa Tecnológica S.A.",
    seatNumber: "A12",
    origin: "Buenos Aires",
    destination: "Córdoba",
    date: "2025-01-25",
    departureTime: "08:00",
    price: 8500,
    status: "confirmed",
    bookedAt: "2025-01-20T10:30:00",
  },
  {
    id: "b2",
    tripId: "t3",
    userId: "4",
    userName: "Ana Martínez",
    userEmail: "user@empresa2.com",
    companyId: "emp2",
    companyName: "Logística Global Corp.",
    seatNumber: "B8",
    origin: "Buenos Aires",
    destination: "Mendoza",
    date: "2025-01-26",
    departureTime: "10:00",
    price: 12000,
    status: "confirmed",
    bookedAt: "2025-01-19T15:20:00",
  },
]
