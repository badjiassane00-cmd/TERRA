export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  family?: string;
  description?: string;
  region: string;
  specialty: string;
  imageUrl?: string;
  medicinal?: boolean;
  care?: {
    watering?: string;
    sunlight?: string;
    soil?: string;
  };
  diseases?: Array<{
    name: string;
    confidence: number;
    treatment: string[];
  }>;
  bloomingMonths?: string[];
}

export interface Region {
  id: string;
  name: string;
  countries: string[];
  plantCount: number;
  specialties: string[];
  bloomingNow: string[];
}

export interface Specialty {
  id: string;
  name: string;
  count: number;
  description: string;
}

