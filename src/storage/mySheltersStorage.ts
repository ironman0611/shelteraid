import AsyncStorage from '@react-native-async-storage/async-storage';

export const MY_SHELTERS_STORAGE_KEY = '@shelteraid/my_shelter_ids';
export const MAX_MY_SHELTERS = 5;

export async function readSavedShelterIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(MY_SHELTERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export async function writeSavedShelterIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(MY_SHELTERS_STORAGE_KEY, JSON.stringify(ids));
}
