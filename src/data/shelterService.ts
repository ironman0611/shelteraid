import { Shelter, ShelterType, ShelterWithDistance } from '../types/shelter';
import { haversineDistance } from './distanceUtils';
import shelterData from '../../assets/data/shelters.json';

const allShelters: Shelter[] = shelterData as Shelter[];

export function loadShelters(): Shelter[] {
  return allShelters;
}

export function filterByType(
  shelters: Shelter[],
  types: ShelterType[],
): Shelter[] {
  if (types.length === 0) return shelters;
  return shelters.filter((s) =>
    types.some((t) => s.type.includes(t)),
  );
}

export function searchShelters(
  shelters: Shelter[],
  query: string,
): Shelter[] {
  const q = query.toLowerCase().trim();
  if (!q) return shelters;
  return shelters.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.organizationName.toLowerCase().includes(q) ||
      s.address.city.toLowerCase().includes(q) ||
      s.address.zip.includes(q) ||
      s.address.state.toLowerCase().includes(q),
  );
}

export function addDistances(
  shelters: Shelter[],
  userLat: number,
  userLon: number,
): ShelterWithDistance[] {
  return shelters.map((s) => ({
    ...s,
    distance: haversineDistance(
      userLat,
      userLon,
      s.coordinates.latitude,
      s.coordinates.longitude,
    ),
  }));
}

export function sortByDistance(
  shelters: ShelterWithDistance[],
): ShelterWithDistance[] {
  return [...shelters].sort((a, b) => a.distance - b.distance);
}

export function sortAlphabetically(shelters: Shelter[]): Shelter[] {
  return [...shelters].sort((a, b) => a.name.localeCompare(b.name));
}

/** Count shelters per type (for badge counts) without creating new arrays */
export function countByType(
  shelters: Shelter[],
): Record<ShelterType, number> {
  const counts = { emergency: 0, transitional: 0, food: 0, medical: 0 };
  for (const s of shelters) {
    for (const t of s.type) {
      counts[t]++;
    }
  }
  return counts;
}
