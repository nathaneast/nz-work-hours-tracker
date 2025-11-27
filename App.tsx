import React, { useCallback } from "react";
import type { WorkLogEntry } from "./types";
import { DemoPage } from "./pages/DemoPage";
import { HomePage } from "./pages/HomePage";
import type { DemoHomePageProps } from "./pages/types";
import { useAuthSession } from "./hooks/useAuthSession";
import { useRouteMode } from "./hooks/useRouteMode";
import { useWorkState } from "./hooks/useWorkState";
import { useCalendarState } from "./hooks/useCalendarState";
import { isSupabaseConfigured } from "./services/supabaseClient";

const App: React.FC = () => {
  const auth = useAuthSession();
  const mode = useRouteMode(auth.user, auth.isAuthLoading);
  const workState = useWorkState(auth.user);
  const calendarState = useCalendarState({
    jobs: workState.jobs,
    workLog: workState.workLog,
  });

  const handleSaveWorkLog = useCallback(
    async (entries: WorkLogEntry[]) => {
      if (!calendarState.selectedDate) {
        return;
      }
      await workState.saveWorkLog(calendarState.selectedDate, entries);
    },
    [calendarState.selectedDate, workState.saveWorkLog]
  );

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
      onUpdateJob: workState.updateJob,
      onDeleteJob: workState.deleteJob,
      onSaveWorkLog: handleSaveWorkLog,
    },
  };

  return mode === "demo" ? (
    <DemoPage {...pageProps} />
  ) : (
    <HomePage {...pageProps} />
  );
};

export default App;
