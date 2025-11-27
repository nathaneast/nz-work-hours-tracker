import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  ensureProfile,
  fetchUserJobs,
  fetchWorkLogs,
} from "../services/dataService";
import type { Job, WorkLog, WorkLogEntry } from "../types";
import { isSupabaseConfigured } from "../services/supabaseClient";
import { MOCK_JOBS, createMockWorkLog } from "../data/mockTrackerData";
import { useWorkActions } from "./useWorkActions";

export type WorkState = {
  jobs: Job[];
  workLog: WorkLog;
  isSyncing: boolean;
  isDataLoading: boolean;
  dataError: string | null;
  setJobs: Dispatch<SetStateAction<Job[]>>;
  setWorkLog: Dispatch<SetStateAction<WorkLog>>;
  addJob: () => Promise<void>;
  updateJob: (
    id: string,
    field: keyof Job,
    value: string | number
  ) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  saveWorkLog: (date: Date, entries: WorkLogEntry[]) => Promise<void>;
  setDataError: (message: string | null) => void;
};

export const useWorkState = (user: User | null): WorkState => {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [workLog, setWorkLog] = useState<WorkLog>(createMockWorkLog);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

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

  const { addJob, updateJob, deleteJob, saveWorkLog } = useWorkActions({
    user,
    jobs,
    workLog,
    setJobs,
    setWorkLog,
    setIsSyncing,
    setDataError,
    handleError: captureDataError,
  });

  return {
    jobs,
    workLog,
    isSyncing,
    isDataLoading,
    dataError,
    setJobs,
    setWorkLog,
    addJob,
    updateJob,
    deleteJob,
    saveWorkLog,
    setDataError,
  };
};
