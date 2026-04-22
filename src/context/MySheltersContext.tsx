import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loadShelters } from '../data/shelterService';
import {
  MAX_MY_SHELTERS,
  readSavedShelterIds,
  writeSavedShelterIds,
} from '../storage/mySheltersStorage';

type MySheltersContextValue = {
  savedIds: string[];
  isReady: boolean;
  isSaved: (shelterId: string) => boolean;
  saveShelter: (shelterId: string) => Promise<boolean>;
  removeShelter: (shelterId: string) => Promise<void>;
};

const MySheltersContext = createContext<MySheltersContextValue | null>(null);

export function MySheltersProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = await readSavedShelterIds();
      if (cancelled) return;
      const valid = new Set(loadShelters().map((s) => s.id));
      const filtered = ids.filter((id) => valid.has(id)).slice(0, MAX_MY_SHELTERS);
      setSavedIds(filtered);
      if (filtered.length !== ids.length) {
        await writeSavedShelterIds(filtered);
      }
      if (!cancelled) setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSaved = useCallback(
    (shelterId: string) => savedIds.includes(shelterId),
    [savedIds],
  );

  const saveShelter = useCallback(async (shelterId: string) => {
    let toPersist: string[] | null = null;
    let ok = false;
    setSavedIds((prev) => {
      if (prev.includes(shelterId)) {
        ok = true;
        return prev;
      }
      if (prev.length >= MAX_MY_SHELTERS) {
        ok = false;
        return prev;
      }
      const updated = [shelterId, ...prev];
      toPersist = updated;
      ok = true;
      return updated;
    });
    if (toPersist) {
      await writeSavedShelterIds(toPersist);
    }
    return ok;
  }, []);

  const removeShelter = useCallback(async (shelterId: string) => {
    let toPersist: string[] | null = null;
    setSavedIds((prev) => {
      const updated = prev.filter((id) => id !== shelterId);
      if (updated.length === prev.length) return prev;
      toPersist = updated;
      return updated;
    });
    if (toPersist) {
      await writeSavedShelterIds(toPersist);
    }
  }, []);

  const value = useMemo(
    () => ({
      savedIds,
      isReady,
      isSaved,
      saveShelter,
      removeShelter,
    }),
    [savedIds, isReady, isSaved, saveShelter, removeShelter],
  );

  return (
    <MySheltersContext.Provider value={value}>{children}</MySheltersContext.Provider>
  );
}

export function useMyShelters() {
  const ctx = useContext(MySheltersContext);
  if (!ctx) {
    throw new Error('useMyShelters must be used within MySheltersProvider');
  }
  return ctx;
}
