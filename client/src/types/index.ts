export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

export interface SeatSelection {
  tripId: number;
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
  'Mbale',
  'Mbarara',
  'Gulu',
  'Fort Portal',
  'Kasese',
  'Arua',
  'Lira',
  'Soroti',
  'Masaka',
  'Hoima',
  'Kabale',
  'Tororo',
];
