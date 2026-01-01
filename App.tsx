import React, { useCallback } from "react";
import type { WorkLogEntry } from "./types";
import { DemoPage } from "./pages/DemoPage";
import { HomePage } from "./pages/HomePage";
import type { DemoHomePageProps } from "./pages/types";
import { useAuthSession } from "./hooks/useAuthSession";
import { useRouteMode } from "./hooks/useRouteMode";
import { useWorkState } from "./hooks/useWorkState";
import { useCalendarState } from "./hooks/useCalendarState";
import { useRegionPreference } from "./hooks/useRegionPreference";
import { useSettingsPreference } from "./hooks/useSettingsPreference";
import { isSupabaseConfigured } from "./services/supabaseClient";
import { EnvironmentBanner } from "./components/EnvironmentBanner";

const App: React.FC = () => {
  const auth = useAuthSession();
  const mode = useRouteMode(auth.user, auth.isAuthLoading);
  const workState = useWorkState(auth.user, auth.isAuthLoading);
  const { savedRegion, isRegionLoading, isRegionSaving, saveRegionPreference } =
    useRegionPreference(auth.user);
  const { settings, saveSettings } = useSettingsPreference(auth.user);
  const calendarState = useCalendarState({
    jobs: workState.jobs,
    workLog: workState.workLog,
    initialRegion: savedRegion,
    weekStartDay: settings.weekStartDay,
  });

  const handleSaveSettings = useCallback(
    (weekStartDay: number) => {
      saveSettings({ weekStartDay: weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
    },
    [saveSettings]
  );

  const handleSaveWorkLog = useCallback(
    async (entries: WorkLogEntry[]) => {
      if (!calendarState.selectedDate) {
        return;
      }
      await workState.saveWorkLog(calendarState.selectedDate, entries);
    },
    [calendarState.selectedDate, workState.saveWorkLog]
  );

  const canPersistRegion =
    mode === "home" && Boolean(auth.user) && isSupabaseConfigured;

  const handlePersistRegion = useCallback(async () => {
    if (!canPersistRegion) {
      return;
    }
    await saveRegionPreference(calendarState.selectedRegion);
  }, [canPersistRegion, saveRegionPreference, calendarState.selectedRegion]);

  const pageProps: DemoHomePageProps = {
    auth: {
      user: auth.user,
      isSupabaseConfigured,
      isAuthLoading: auth.isAuthLoading,
      authError: auth.authError,
      onSignIn: auth.handleSignIn,
      onSignOut: auth.handleSignOut,
      showDemoBanner: mode === "demo" && !auth.user,
    },
    calendar: calendarState,
    work: {
      jobs: workState.jobs,
      workLog: workState.workLog,
      isSyncing: workState.isSyncing,
      isDataLoading: workState.isDataLoading,
      dataError: workState.dataError,
      onAddJob: workState.addJob,
      onSaveJob: workState.saveJob,
      onDeleteJob: workState.deleteJob,
      onSaveWorkLog: handleSaveWorkLog,
    },
    regionPersistence: canPersistRegion
      ? {
          canPersist: true,
          isSaving: isRegionSaving,
          isDirty: savedRegion !== calendarState.selectedRegion,
          isLoading: isRegionLoading,
          onSave: handlePersistRegion,
        }
      : undefined,
    settings: {
      weekStartDay: settings.weekStartDay,
      onSaveSettings: handleSaveSettings,
    },
  };

  const PageComponent = mode === "demo" ? DemoPage : HomePage;

  return (
    <>
      <EnvironmentBanner />
      <PageComponent {...pageProps} />
    </>
  );
};

export default App;
