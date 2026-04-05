import { useState, useMemo } from 'react';
import { Shelter, ShelterType, ShelterWithDistance } from '../types/shelter';
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
): UseSheltersResult {
  const [filters, setFilters] = useState<ShelterType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { shelters, counts, totalCount } = useMemo(() => {
    let result: Shelter[] = loadShelters();
    result = searchShelters(result, searchQuery);

    // Counts — single pass, no extra arrays
    const counts = countByType(result);

    result = filterByType(result, filters);
    const totalCount = result.length;

    if (userLat != null && userLon != null) {
      const withDist = addDistances(result, userLat, userLon);
      const sorted = sortByDistance(withDist);
      const cap = limit ?? MAP_LIMIT;
      return { shelters: sorted.slice(0, cap), counts, totalCount };
    }

    const sorted = sortAlphabetically(result);
    const cap = limit ?? LIST_LIMIT;
    return { shelters: sorted.slice(0, cap), counts, totalCount };
  }, [filters, searchQuery, userLat, userLon, limit]);

  return { shelters, filters, setFilters, searchQuery, setSearchQuery, counts, totalCount };
}
