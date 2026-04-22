import { useState, useMemo } from 'react';
import { Shelter, ShelterType, ShelterWithDistance } from '../types/shelter';
import type { RadiusOption } from '../constants/radius';
import {
  loadShelters,
  filterByType,
  searchShelters,
  addDistances,
  sortByDistance,
  sortAlphabetically,
  countByType,
} from '../data/shelterService';

const MAP_LIMIT = 200;
const LIST_LIMIT = 50;

interface UseSheltersResult {
  shelters: (Shelter | ShelterWithDistance)[];
  filters: ShelterType[];
  setFilters: React.Dispatch<React.SetStateAction<ShelterType[]>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  counts: Record<ShelterType, number>;
  totalCount: number;
}

export function useShelters(
  userLat: number | null,
  userLon: number | null,
  limit?: number,
  radiusMiles: RadiusOption = 10,
): UseSheltersResult {
  const [filters, setFilters] = useState<ShelterType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { shelters, counts, totalCount } = useMemo(() => {
    let pool: Shelter[] = loadShelters();
    pool = searchShelters(pool, searchQuery);

    const hasLoc = userLat != null && userLon != null;
    const cap = limit ?? (hasLoc ? MAP_LIMIT : LIST_LIMIT);

    // Radius filter: compute distances on search pool, then restrict (counts reflect in-radius only).
    if (hasLoc && radiusMiles != null) {
      const withDist = addDistances(pool, userLat, userLon);
      const inRadius = withDist.filter((s) => s.distance <= radiusMiles);
      const counts = countByType(inRadius);
      const result = filterByType(inRadius, filters);
      const totalCount = result.length;
      const sorted = sortByDistance(result as ShelterWithDistance[]);
      return { shelters: sorted.slice(0, cap), counts, totalCount };
    }

    // No radius cap (or no location): same flow as before — type filter before distance for "Any" + location.
    const counts = countByType(pool);
    const result = filterByType(pool, filters);
    const totalCount = result.length;

    if (hasLoc) {
      const withDist = addDistances(result, userLat, userLon);
      const sorted = sortByDistance(withDist);
      return { shelters: sorted.slice(0, cap), counts, totalCount };
    }

    const sorted = sortAlphabetically(result);
    return { shelters: sorted.slice(0, cap), counts, totalCount };
  }, [filters, searchQuery, userLat, userLon, limit, radiusMiles]);

  return { shelters, filters, setFilters, searchQuery, setSearchQuery, counts, totalCount };
}
