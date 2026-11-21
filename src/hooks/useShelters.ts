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
/** How many nearest shelters to show when nothing is inside the selected radius. */
const FALLBACK_LIMIT = 25;

interface UseSheltersResult {
  shelters: (Shelter | ShelterWithDistance)[];
  filters: ShelterType[];
  setFilters: React.Dispatch<React.SetStateAction<ShelterType[]>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  counts: Record<ShelterType, number>;
  totalCount: number;
  /** True when nothing matched inside the radius and `shelters` holds the nearest matches instead. */
  outsideRadius: boolean;
}

export function useShelters(
  userLat: number | null,
  userLon: number | null,
  limit?: number,
  radiusMiles: RadiusOption = 10,
): UseSheltersResult {
  const [filters, setFilters] = useState<ShelterType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { shelters, counts, totalCount, outsideRadius } = useMemo(() => {
    let pool: Shelter[] = loadShelters();
    pool = searchShelters(pool, searchQuery);

    const hasLoc = userLat != null && userLon != null;
    const cap = limit ?? (hasLoc ? MAP_LIMIT : LIST_LIMIT);

    // Radius filter: compute distances on search pool, then restrict (counts reflect in-radius only).
    if (hasLoc && radiusMiles != null) {
      const withDist = addDistances(pool, userLat, userLon);
      const inRadius = withDist.filter((s) => s.distance <= radiusMiles);
      const result = filterByType(inRadius, filters);
      if (result.length > 0) {
        const counts = countByType(inRadius);
        const totalCount = result.length;
        const sorted = sortByDistance(result as ShelterWithDistance[]);
        return { shelters: sorted.slice(0, cap), counts, totalCount, outsideRadius: false };
      }

      // Nothing nearby (e.g. user outside data coverage, or searching a far-away ZIP):
      // fall back to the nearest matches so the user never sees an empty map/list.
      const nearest = sortByDistance(
        filterByType(withDist, filters) as ShelterWithDistance[],
      ).slice(0, Math.min(cap, FALLBACK_LIMIT));
      return {
        shelters: nearest,
        counts: countByType(withDist),
        totalCount: nearest.length,
        outsideRadius: nearest.length > 0,
      };
    }

    // No radius cap (or no location): same flow as before — type filter before distance for "Any" + location.
    const counts = countByType(pool);
    const result = filterByType(pool, filters);
    const totalCount = result.length;

    if (hasLoc) {
      const withDist = addDistances(result, userLat, userLon);
      const sorted = sortByDistance(withDist);
      return { shelters: sorted.slice(0, cap), counts, totalCount, outsideRadius: false };
    }

    const sorted = sortAlphabetically(result);
    return { shelters: sorted.slice(0, cap), counts, totalCount, outsideRadius: false };
  }, [filters, searchQuery, userLat, userLon, limit, radiusMiles]);

  return {
    shelters,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    counts,
    totalCount,
    outsideRadius,
  };
}
