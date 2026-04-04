import { useState, useMemo } from 'react';
import { Shelter, ShelterType, ShelterWithDistance } from '../types/shelter';
import {
  loadShelters,
  filterByType,
  searchShelters,
  addDistances,
  sortByDistance,
  sortAlphabetically,
} from '../data/shelterService';

const ALL_TYPES: ShelterType[] = ['emergency', 'transitional', 'food', 'medical'];

interface UseSheltersResult {
  shelters: (Shelter | ShelterWithDistance)[];
  filters: ShelterType[];
  setFilters: React.Dispatch<React.SetStateAction<ShelterType[]>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  counts: Record<ShelterType, number>;
}

export function useShelters(
  userLat: number | null,
  userLon: number | null,
): UseSheltersResult {
  const [filters, setFilters] = useState<ShelterType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { shelters, counts } = useMemo(() => {
    let result: Shelter[] = loadShelters();
    result = searchShelters(result, searchQuery);

    // Counts are computed after search but before type filtering
    const counts = ALL_TYPES.reduce((acc, type) => {
      acc[type] = result.filter((s) => s.type.includes(type)).length;
      return acc;
    }, {} as Record<ShelterType, number>);

    result = filterByType(result, filters);

    if (userLat != null && userLon != null) {
      const withDist = addDistances(result, userLat, userLon);
      return { shelters: sortByDistance(withDist), counts };
    }

    return { shelters: sortAlphabetically(result), counts };
  }, [filters, searchQuery, userLat, userLon]);

  return { shelters, filters, setFilters, searchQuery, setSearchQuery, counts };
}
