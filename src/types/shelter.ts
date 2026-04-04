export type ShelterType = 'emergency' | 'transitional' | 'food' | 'medical';

export interface Shelter {
  id: string;
  name: string;
  organizationName: string;
  type: ShelterType[];
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  phone: string | null;
  website: string | null;
  capacity: {
    totalBeds: number;
    yearRoundBeds: number;
    seasonalBeds: number;
  };
  services: string[];
  hours: string;
  eligibility: string;
  status: 'open' | 'limited' | 'closed';
  lastUpdated: string;
}

export interface ShelterWithDistance extends Shelter {
  distance: number; // miles
}
