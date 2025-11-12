import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Job, WorkLog, PayDetails, WorkLogEntry, Region } from "./types";
import { Calendar } from "./components/Calendar";
import { PaySummary } from "./components/PaySummary";
import { JobEditor } from "./components/JobEditor";
import { WorkLogModal } from "./components/WorkLogModal";
import { calculateWeeklyPay } from "./services/payCalculator";
import {
  NZ_MINIMUM_WAGE,
  JOB_COLORS,
  NZ_NATIONAL_HOLIDAYS,
  NZ_PROVINCIAL_HOLIDAYS,
  NZ_REGIONS,
} from "./constants";
import { toYYYYMMDD, getStartOfWeek } from "./utils";
import { PlusIcon } from "./components/icons/PlusIcon";
import { supabase, isSupabaseConfigured } from "./services/supabaseClient";
import {
  deleteJob as deleteJobRemote,
  deleteWorkLogsForJob,
  ensureProfile,
  fetchUserJobs,
  fetchWorkLogs,
  saveWorkLogForDate,
  upsertJob,
} from "./services/dataService";

const MOCK_JOBS: Job[] = [
  {
    id: "job_1",
    name: "Cafe Barista",
    payRate: NZ_MINIMUM_WAGE,
    color: JOB_COLORS[0],
  },
  { id: "job_2", name: "Farm Hand", payRate: 24.5, color: JOB_COLORS[1] },
];

const createMockWorkLog = (): WorkLog => {
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  const sampleLog: WorkLog = {};

  const makeDay = (offset: number, entries: WorkLogEntry[]) => {
    const date = new Date(startOfWeek);
    date.setUTCDate(startOfWeek.getUTCDate() + offset);
    sampleLog[toYYYYMMDD(date)] = entries;
  };

  makeDay(0, [{ jobId: "job_1", hours: 8 }]);
  makeDay(1, [{ jobId: "job_2", hours: 8 }]);
  makeDay(2, [
    { jobId: "job_1", hours: 4 },
    { jobId: "job_2", hours: 4 },
  ]);
  makeDay(3, [
    { jobId: "job_1", hours: 4 },
    { jobId: "job_2", hours: 4 },
  ]);
  makeDay(4, [{ jobId: "job_1", hours: 8 }]);

  return sampleLog;
};

const cloneWorkLog = (source: WorkLog): WorkLog => {
  const copy: WorkLog = {};
  Object.entries(source).forEach(([date, entries]) => {
    const typedEntries = entries as WorkLogEntry[];
    copy[date] = typedEntries.map((entry) => ({ ...entry }));
  });
  return copy;
};

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRegion, setSelectedRegion] = useState<Region>("None");
  const [isRegionSelectorVisible, setIsRegionSelectorVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<Job[]>(() => {
    return MOCK_JOBS;
  });

  const [workLog, setWorkLog] = useState<WorkLog>(() => {
    return createMockWorkLog();
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payDetails, setPayDetails] = useState<PayDetails>({
    grossPay: 0,
    tax: 0,
    accLevy: 0,
    netPay: 0,
    totalHours: 0,
    holidayHours: 0,
    jobBreakdown: [],
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const shouldShowLoginBanner = !user;
  const buildNewJob = useCallback((existingJobs: Job[]): Job => {
    const color = JOB_COLORS[existingJobs.length % JOB_COLORS.length];
    return {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `job_${Date.now()}`,
      name: `Job ${existingJobs.length + 1}`,
      payRate: NZ_MINIMUM_WAGE,
      color,
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) {
          setUser(data.session?.user ?? null);
        }
      } catch (error_) {
        if (isMounted) {
          setAuthError((error_ as Error).message);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    void initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const captureDataError = useCallback((context: string, error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, error);
    setDataError(
      error instanceof Error
        ? `${context}: ${error.message}`
        : `${context}: 알 수 없는 오류가 발생했습니다.`
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!user || !isSupabaseConfigured) {
      setIsDataLoading(false);
      setDataError(null);
      setJobs(MOCK_JOBS);
      setWorkLog(createMockWorkLog());
      return () => {
        isMounted = false;
      };
    }

    const loadUserData = async () => {
      setIsDataLoading(true);
      setDataError(null);
      try {
        await ensureProfile(user.id, user.email);
        const [jobsData, workLogsData] = await Promise.all([
          fetchUserJobs(user.id),
          fetchWorkLogs(user.id),
        ]);

        if (!isMounted) {
          return;
        }

        setJobs(jobsData.length > 0 ? jobsData : []);
        setWorkLog(workLogsData);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        captureDataError("데이터 불러오기 실패", error);
        setJobs(MOCK_JOBS);
        setWorkLog(createMockWorkLog());
      } finally {
        if (isMounted) {
          setIsDataLoading(false);
        }
      }
    };

    void loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user, captureDataError]);

  const handleSignIn = async () => {
    if (!isSupabaseConfigured) {
      setAuthError("Supabase 환경변수가 설정되지 않았습니다.");
      return;
    }

    setAuthError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    if (!isSupabaseConfigured) {
      return;
    }
    await supabase.auth.signOut();
    setJobs(MOCK_JOBS);
    setWorkLog(createMockWorkLog());
  };

  // Combine national holidays with the selected regional holiday
  const allHolidays = useMemo(() => {
    if (selectedRegion === "None") {
      return NZ_NATIONAL_HOLIDAYS;
    }
    const provincial = NZ_PROVINCIAL_HOLIDAYS.filter(
      (h) => h.region === selectedRegion
    );
    return [...NZ_NATIONAL_HOLIDAYS, ...provincial];
  }, [selectedRegion]);

  const holidayMap = useMemo(
    () => new Map(allHolidays.map((h) => [h.date, h.name])),
    [allHolidays]
  );

  const startOfWeek = getStartOfWeek(currentDate);
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setUTCDate(startOfWeek.getUTCDate() + i);
    return day;
  });

  useEffect(() => {
    const details = calculateWeeklyPay(workLog, jobs, week, allHolidays);
    setPayDetails(details);
  }, [workLog, jobs, currentDate, allHolidays]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleSaveWorkLog = async (entries: WorkLogEntry[]) => {
    if (!selectedDate) {
      return;
    }

    const dateStr = toYYYYMMDD(selectedDate);
    const previousWorkLog = cloneWorkLog(workLog);

    setWorkLog((prev) => {
      const newLog = { ...prev };
      if (entries.length > 0) {
        newLog[dateStr] = entries;
      } else {
        // If entries are empty, remove the key from the worklog
        delete newLog[dateStr];
      }
      return newLog;
    });

    if (!user || !isSupabaseConfigured) {
      return;
    }

    setIsSyncing(true);
    setDataError(null);
    try {
      await saveWorkLogForDate(user.id, dateStr, entries);
    } catch (error) {
      captureDataError("근무 기록 저장 실패", error);
      setWorkLog(previousWorkLog);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddJob = async () => {
    const newJob = buildNewJob(jobs);

    if (!user || !isSupabaseConfigured) {
      setJobs((prev) => [...prev, newJob]);
      return;
    }

    setIsSyncing(true);
    setDataError(null);
    try {
      const savedJob = await upsertJob(user.id, newJob);
      setJobs((prev) => [...prev, savedJob]);
    } catch (error) {
      captureDataError("작업 추가 실패", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateJob = async (
    id: string,
    field: keyof Job,
    value: string | number
  ) => {
    const targetJob = jobs.find((job) => job.id === id);
    if (!targetJob) {
      return;
    }

    const updatedJob: Job = { ...targetJob, [field]: value } as Job;
    setJobs((prev) => prev.map((job) => (job.id === id ? updatedJob : job)));

    if (!user || !isSupabaseConfigured) {
      return;
    }

    setDataError(null);
    try {
      const savedJob = await upsertJob(user.id, updatedJob);
      setJobs((prev) => prev.map((job) => (job.id === id ? savedJob : job)));
    } catch (error) {
      captureDataError("작업 수정 실패", error);
      setJobs((prev) => prev.map((job) => (job.id === id ? targetJob : job)));
    }
  };

  const handleDeleteJob = async (id: string) => {
    const targetJob = jobs.find((job) => job.id === id);
    if (!targetJob) {
      return;
    }

    const previousJobs = jobs;
    const previousWorkLog = cloneWorkLog(workLog);

    setJobs((prev) => prev.filter((job) => job.id !== id));
    setWorkLog((prev) => {
      const updated: WorkLog = {};
      Object.entries(prev).forEach(([date, entries]) => {
        const entriesForDate = entries as WorkLogEntry[];
        const filtered = entriesForDate.filter((entry) => entry.jobId !== id);
        if (filtered.length > 0) {
          updated[date] = filtered;
        }
      });
      return updated;
    });

    if (!user || !isSupabaseConfigured) {
      return;
    }

    setIsSyncing(true);
    setDataError(null);
    try {
      await Promise.all([
        deleteJobRemote(user.id, id),
        deleteWorkLogsForJob(user.id, id),
      ]);
    } catch (error) {
      captureDataError("작업 삭제 실패", error);
      setJobs(previousJobs);
      setWorkLog(previousWorkLog);
    } finally {
      setIsSyncing(false);
    }
  };

  const changeWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setUTCDate(
        newDate.getUTCDate() + (direction === "next" ? 7 : -7)
      );
      return newDate;
    });
  };

  const holidayName = selectedDate
    ? holidayMap.get(toYYYYMMDD(selectedDate))
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
            NZ Work Hours Tracker
          </h1>
          <p className="text-secondary mt-2">
            Track your hours, estimate your weekly pay in New Zealand.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            {isSupabaseConfigured ? (
              <>
                {user ? (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600">{user.email}</span>
                    <button
                      onClick={handleSignOut}
                      className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSignIn}
                    disabled={isAuthLoading}
                    className="px-4 py-2 bg-secondary text-white rounded-lg disabled:bg-gray-400 hover:bg-primary transition-colors text-sm sm:text-base"
                  >
                    {isAuthLoading
                      ? "Preparing sign-in…"
                      : "Sign in with Google"}
                  </button>
                )}
              </>
            ) : (
              <span className="text-sm text-red-600">
                Supabase 환경변수가 설정되지 않아 로그인과 동기화가 비활성화
                상태입니다.
              </span>
            )}
            {authError && (
              <span className="text-sm text-red-600">{authError}</span>
            )}
          </div>
          {shouldShowLoginBanner && (
            <div className="mt-6 w-full max-w-2xl mx-auto bg-yellow-100 border border-yellow-300 text-yellow-900 px-5 py-4 rounded-lg text-left sm:text-center">
              <p className="text-base font-semibold">지금은 체험 모드입니다.</p>
              <p className="mt-2 text-sm sm:text-base text-yellow-800">
                현재 입력하는 값은 이 브라우저에만 임시로 유지됩니다. Google로
                로그인하면 언제든 다시 불러올 수 있도록 Supabase에 안전하게
                저장됩니다.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
                <button
                  onClick={handleSignIn}
                  disabled={!isSupabaseConfigured || isAuthLoading}
                  className="inline-flex items-center justify-center px-5 py-2 bg-secondary text-white font-medium rounded-md shadow-sm hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isAuthLoading ? "Preparing sign-in…" : "Sign in with Google"}
                </button>
                <span className="text-xs sm:text-sm text-yellow-700">
                  로그인 후에는 작업·근무 기록이 자동으로 저장됩니다.
                </span>
              </div>
            </div>
          )}
        </header>

        {user && isDataLoading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-6 text-sm">
            Loading your saved jobs and work logs…
          </div>
        )}

        {dataError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
            {dataError}
          </div>
        )}

        {user && isSupabaseConfigured && isSyncing && (
          <div className="bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2 rounded-md mb-6 text-sm">
            Saving your changes to Supabase…
          </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-4 bg-white rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => changeWeek("prev")}
                  className="px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  <span className="sm:hidden">&larr;</span>
                  <span className="hidden sm:inline">&larr; Previous</span>
                </button>
                <h2 className="text-lg sm:text-xl font-bold text-center">
                  {startOfWeek.toLocaleDateString("en-NZ", {
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}{" "}
                  -{" "}
                  {week[6].toLocaleDateString("en-NZ", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </h2>
                <button
                  onClick={() => changeWeek("next")}
                  className="px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  <span className="sm:hidden">&rarr;</span>
                  <span className="hidden sm:inline">Next &rarr;</span>
                </button>
              </div>
              <Calendar
                week={week}
                workLog={workLog}
                jobs={jobs}
                onDayClick={handleDayClick}
                currentDate={currentDate}
                holidays={allHolidays}
              />
            </div>
            <div className="p-4 bg-white rounded-lg shadow-md">
              {!isRegionSelectorVisible ? (
                <>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Provincial Holiday
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 mb-3">
                    Optionally add your region's anniversary day for more
                    accurate pay calculation.
                  </p>
                  <button
                    onClick={() => setIsRegionSelectorVisible(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" /> Add Provincial Holiday
                  </button>
                </>
              ) : (
                <>
                  <label
                    htmlFor="region-select"
                    className="block text-lg font-medium text-gray-700 mb-2"
                  >
                    Select Your Region
                  </label>
                  <select
                    id="region-select"
                    value={selectedRegion}
                    onChange={(e) =>
                      setSelectedRegion(e.target.value as Region)
                    }
                    className="w-full p-2 border rounded-md bg-white text-gray-900 focus:ring-primary focus:border-primary"
                    aria-label="Select your region to include provincial holidays"
                  >
                    {NZ_REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region === "None"
                          ? "National Holidays Only"
                          : `${region}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-2">
                    This adds your provincial anniversary day to the calendar
                    for accurate pay calculation.
                  </p>
                </>
              )}
            </div>
            <JobEditor
              jobs={jobs}
              onAddJob={handleAddJob}
              onUpdateJob={handleUpdateJob}
              onDeleteJob={handleDeleteJob}
              disabled={isSyncing || isDataLoading}
              isAuthenticated={Boolean(user)}
            />
          </div>

          <div className="lg:col-span-1">
            <PaySummary payDetails={payDetails} />
          </div>
        </main>
      </div>

      {isModalOpen && selectedDate && (
        <WorkLogModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          date={selectedDate}
          jobs={jobs}
          workLogForDay={workLog[toYYYYMMDD(selectedDate)] || []}
          onSave={handleSaveWorkLog}
          holidayName={holidayName}
        />
      )}
    </div>
  );
};

export default App;
