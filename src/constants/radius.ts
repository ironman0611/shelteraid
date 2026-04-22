/** Default search/map radius when location is available. */
export const DEFAULT_RADIUS_MILES = 10;

export type RadiusOption = number | null;

export const RADIUS_OPTIONS: { label: string; value: RadiusOption }[] = [
  { label: '5 mi', value: 5 },
  { label: '10 mi', value: 10 },
  { label: '25 mi', value: 25 },
  { label: '50 mi', value: 50 },
  { label: '100 mi', value: 100 },
  { label: 'Any', value: null },
];
