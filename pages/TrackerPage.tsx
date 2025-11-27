import React, { useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import type { Job, Region, WorkLog, WorkLogEntry } from "../types";
import { Calendar } from "../components/Calendar";
import { PaySummary } from "../components/PaySummary";
import { JobEditor } from "../components/JobEditor";
import { WorkLogModal } from "../components/WorkLogModal";
import type { CalendarState } from "../hooks/useCalendarState";
import type { RouteMode } from "../hooks/useRouteMode";
import { toYYYYMMDD } from "../utils";
import { TrackerHeader } from "../components/TrackerHeader";
import { RegionSelectorCard } from "../components/RegionSelectorCard";
import { WeekNavigator } from "../components/WeekNavigator";

type AuthProps = {
  user: User | null;
  isSupabaseConfigured: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  showDemoBanner: boolean;
};

type WorkProps = {
  jobs: Job[];
  workLog: WorkLog;
  isSyncing: boolean;
  isDataLoading: boolean;
  dataError: string | null;
  onAddJob: () => Promise<void>;
  onSaveJob: (
    id: string,
    updates: { name: string; payRate: number }
  ) => Promise<void>;
  onDeleteJob: (id: string) => Promise<void>;
  onSaveWorkLog: (entries: WorkLogEntry[]) => Promise<void>;
};

type RegionPersistenceProps = {
  canPersist: boolean;
  isSaving: boolean;
  isDirty: boolean;
  isLoading: boolean;
  onSave: () => Promise<void> | void;
};

export type TrackerPageProps = {
  mode: RouteMode;
  auth: AuthProps;
  calendar: CalendarState;
  work: WorkProps;
  regionPersistence?: RegionPersistenceProps;
};

const formatRange = (week: Date[]) => {
  if (week.length === 0) {
    return "";
  }
  const start = week[0];
  const end = week[6];
  return `${start.toLocaleDateString("en-NZ", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })} - ${end.toLocaleDateString("en-NZ", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })}`;
};

export const TrackerPage: React.FC<TrackerPageProps> = ({
  mode,
  auth,
  calendar,
  work,
  regionPersistence,
}) => {
  const selectedDayEntries = useMemo(() => {
    if (!calendar.selectedDate) {
      return [];
    }
    const key = toYYYYMMDD(calendar.selectedDate);
    return work.workLog[key] ?? [];
  }, [calendar.selectedDate, work.workLog]);

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8"
      data-page={mode}
    >
      <div className="max-w-7xl mx-auto">
        <TrackerHeader
          user={auth.user}
          isSupabaseConfigured={auth.isSupabaseConfigured}
          isAuthLoading={auth.isAuthLoading}
          authError={auth.authError}
          onSignIn={auth.onSignIn}
          onSignOut={auth.onSignOut}
          showDemoBanner={auth.showDemoBanner}
        />

        {auth.user && work.isDataLoading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-6 text-sm">
            Loading your saved jobs and work logs…
          </div>
        )}

        {work.dataError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
            {work.dataError}
          </div>
        )}

        {auth.user && auth.isSupabaseConfigured && work.isSyncing && (
          <div className="bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2 rounded-md mb-6 text-sm">
            Saving your changes to Supabase…
          </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-4 bg-white rounded-lg shadow-md">
              <WeekNavigator
                label={formatRange(calendar.week)}
                onPrev={() => calendar.changeWeek("prev")}
                onNext={() => calendar.changeWeek("next")}
              />
              <Calendar
                week={calendar.week}
                workLog={work.workLog}
                jobs={work.jobs}
                onDayClick={calendar.handleDayClick}
                currentDate={calendar.currentDate}
                holidays={calendar.allHolidays}
              />
            </div>
            <RegionSelectorCard
              isVisible={
                calendar.isRegionSelectorVisible ||
                calendar.selectedRegion !== "None"
              }
              selectedRegion={calendar.selectedRegion}
              regions={calendar.regions}
              onSelectRegion={calendar.setSelectedRegion}
              onRevealSelector={() => calendar.setIsRegionSelectorVisible(true)}
              persistOptions={
                regionPersistence?.canPersist
                  ? {
                      onSave: regionPersistence.onSave,
                      isSaving: regionPersistence.isSaving,
                      isDirty: regionPersistence.isDirty,
                      isLoading: regionPersistence.isLoading,
                    }
                  : undefined
              }
            />
            <JobEditor
              jobs={work.jobs}
              onAddJob={work.onAddJob}
              onSaveJob={work.onSaveJob}
              onDeleteJob={work.onDeleteJob}
              disabled={work.isSyncing || work.isDataLoading}
              isAuthenticated={Boolean(auth.user)}
            />
          </div>

          <div className="lg:col-span-1">
            <PaySummary payDetails={calendar.payDetails} />
          </div>
        </main>
      </div>

      {calendar.isModalOpen && calendar.selectedDate && (
        <WorkLogModal
          isOpen={calendar.isModalOpen}
          onClose={calendar.handleModalClose}
          date={calendar.selectedDate}
          jobs={work.jobs}
          workLogForDay={selectedDayEntries}
          onSave={work.onSaveWorkLog}
          holidayName={calendar.holidayName}
        />
      )}
    </div>
  );
};
