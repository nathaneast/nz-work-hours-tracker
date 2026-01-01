import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  fetchProfileWeekStartDay,
  saveProfileWeekStartDay,
} from '../services/dataService';
import { isSupabaseConfigured } from '../services/supabaseClient';

export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

const SETTINGS_STORAGE_KEY = 'nz-work-hours-tracker-settings';
const DEFAULT_WEEK_START_DAY: WeekStartDay = 1; // Monday

interface Settings {
  weekStartDay: WeekStartDay;
}

const defaultSettings: Settings = {
  weekStartDay: DEFAULT_WEEK_START_DAY,
};

export const useSettingsPreference = (user: User | null) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      // If not logged in, use localStorage
      try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<Settings>;
          const updated: Settings = { ...defaultSettings };
          // Validate weekStartDay
          if (typeof parsed.weekStartDay === 'number' && parsed.weekStartDay >= 0 && parsed.weekStartDay <= 6) {
            updated.weekStartDay = parsed.weekStartDay;
          }
          setSettings(updated);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load settings from localStorage', error);
      }
      setIsLoading(false);
      setSettingsError(null);
      return;
    }

    // If logged in, load from DB
    let isCancelled = false;
    const load = async () => {
      setIsLoading(true);
      setSettingsError(null);
      try {
        const weekStartDay = await fetchProfileWeekStartDay(user.id);
        if (!isCancelled) {
          setSettings({ weekStartDay: weekStartDay as WeekStartDay });
        }
      } catch (error) {
        if (!isCancelled) {
          setSettingsError(
            error instanceof Error
              ? error.message
              : 'Failed to load week start day'
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const saveSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      if (!user || !isSupabaseConfigured) {
        // If not logged in, save to localStorage
        try {
          setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to save settings to localStorage', error);
          throw error;
        }
        return;
      }

      // If logged in, save to DB
      setIsSaving(true);
      setSettingsError(null);
      try {
        if (newSettings.weekStartDay !== undefined) {
          await saveProfileWeekStartDay(user.id, newSettings.weekStartDay);
          setSettings((prev) => ({ ...prev, weekStartDay: newSettings.weekStartDay as WeekStartDay }));
        }
      } catch (error) {
        setSettingsError(
          error instanceof Error
            ? error.message
            : 'Failed to save week start day'
        );
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [user]
  );

  return {
    settings,
    isLoading,
    isSaving,
    settingsError,
    saveSettings,
  };
};

