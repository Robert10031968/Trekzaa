import type { SelectUser } from "@db/schema";

export interface Guide {
  id: number;
  userId: number;
  specialties: string[];
  locations: string[];
  rating: string;
  verified: boolean;
  matchScore?: number;
  matchDetails?: {
    specialtyMatch: number;
    locationMatch: number;
    ratingScore: number;
    preferenceMatch?: number;
  };
  user: SelectUser;
}
