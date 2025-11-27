import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Region } from "../types";
import {
  fetchProfileRegion,
  saveProfileRegion,
} from "../services/dataService";
import { isSupabaseConfigured } from "../services/supabaseClient";

const DEFAULT_REGION: Region = "None";

export const useRegionPreference = (user: User | null) => {
  const [savedRegion, setSavedRegion] = useState<Region>(DEFAULT_REGION);
  const [isRegionLoading, setIsRegionLoading] = useState(false);
  const [isRegionSaving, setIsRegionSaving] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setSavedRegion(DEFAULT_REGION);
      setIsRegionLoading(false);
      setRegionError(null);
      return;
    }

    let isCancelled = false;
    const load = async () => {
      setIsRegionLoading(true);
      setRegionError(null);
      try {
        const region = await fetchProfileRegion(user.id);
        if (!isCancelled) {
          setSavedRegion(region);
        }
      } catch (error) {
        if (!isCancelled) {
          setRegionError(
            error instanceof Error
              ? error.message
              : "Failed to load default region"
          );
        }
      } finally {
        if (!isCancelled) {
          setIsRegionLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const saveRegionPreference = useCallback(
    async (region: Region) => {
      if (!user || !isSupabaseConfigured) {
        setSavedRegion(region);
        return;
      }

      setIsRegionSaving(true);
      setRegionError(null);
      try {
        await saveProfileRegion(user.id, region);
        setSavedRegion(region);
      } catch (error) {
        setRegionError(
          error instanceof Error
            ? error.message
            : "Failed to save default region"
        );
        throw error;
      } finally {
        setIsRegionSaving(false);
      }
    },
    [user]
  );

  return {
    savedRegion,
    isRegionLoading,
    isRegionSaving,
    regionError,
    saveRegionPreference,
  };
};
