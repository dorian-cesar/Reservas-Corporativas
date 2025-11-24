export interface BookingRequest {
  serviceId: string;
  seatNumber: string;
  price: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  originId: number;
  destinationId: number;
  travelDate: string;
}

export interface BookingResponse {
  success: boolean;
  pnrNumber: string;
  operatorPnr: string;
  travelId: number;
  travelName: string;
  seatNumber: string;
  bookingDate: string;
}

export interface ConfirmRequest {
  pnrNumber: string;
}

export interface ConfirmResponse {
  success: boolean;
  pnrNumber: string;
  ticketNumber: string;
  operatorPnr: string;
  ticketStatus: string;
  travelName: string;
  serviceNumber: string;
  origin: string;
  destination: string;
  travelDate: string;
  departureTime: string;
  duration: string;
  seatNumbers: string;
  totalFare: number;
  busType: string;
  boardingPoint: {
    name: string;
    dep_time: string;
    boarding_stage_address: string;
    landmark: string;
    contact_numbers: string;
    stage_id: string;
    op_stage_id: string;
  };
  passengerDetails: {
    title: string;
    gender: string | null;
    name: string;
    age: number;
    mobile: string;
    email: string;
  };
  seatFareDetails: Array<{
    seat_detail: {
      seat_number: string;
      fare: number;
      api_fare: number;
      seat_type: string;
    };
  }>;
  qrCode?: string;
  boardingQrCodes?: {
    [key: string]: string;
  };
  confirmedAt: string;
}
