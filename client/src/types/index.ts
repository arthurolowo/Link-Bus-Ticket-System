export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  minTime?: string;
  maxTime?: string;
  minPrice?: number;
  maxPrice?: number;
  busType?: string;
}

export interface SeatSelection {
  tripId: string;
  selectedSeats: string[];
  passengerDetails: {
    name: string;
    phone: string;
    email?: string;
  };
}

export interface PaymentData {
  method: 'card' | 'mobile_money' | 'bank_transfer';
  cardDetails?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
  mobileDetails?: {
    provider: 'mtn' | 'airtel';
    number: string;
  };
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'lg', name: 'Luganda', flag: '🇺🇬' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
];

export const UGANDAN_CITIES = [
  'Kampala',
  'Entebbe',
  'Jinja',
  'Mbarara',
  'Gulu',
  'Lira',
  'Mbale',
  'Fort Portal',
  'Masaka',
  'Arua',
  'Kabale',
  'Kasese',
  'Tororo',
  'Soroti',
  'Hoima',
] as const;

export type UgandanCity = typeof UGANDAN_CITIES[number];

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  isAdmin: boolean;
}

export interface Trip {
  id: string;
  origin: UgandanCity;
  destination: UgandanCity;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  busType: string;
}

export interface Booking {
  id: string;
  userId: string;
  tripId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  seatNumbers: number[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  bookingReference: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  paymentStatus: 'completed' | 'pending' | 'failed';
}

export interface TripWithDetails {
  id: string;
  route: {
    origin: string;
    destination: string;
    estimatedDuration?: number;
  };
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  bus: {
    busType: {
      name: string;
      totalSeats: number;
    };
    busNumber: string;
  };
}
