import { Dispatch, SetStateAction, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import {
  deleteJob as deleteJobRemote,
  deleteWorkLogsForJob,
  saveWorkLogForDate,
  upsertJob,
} from "../services/dataService";
import type { Job, WorkLog, WorkLogEntry } from "../types";
import { JOB_COLORS, NZ_MINIMUM_WAGE } from "../constants";
import { toYYYYMMDD } from "../utils";
import { isSupabaseConfigured } from "../services/supabaseClient";
import { cloneWorkLog } from "../data/mockTrackerData";

type Options = {
  user: User | null;
  jobs: Job[];
  workLog: WorkLog;
  setJobs: Dispatch<SetStateAction<Job[]>>;
  setWorkLog: Dispatch<SetStateAction<WorkLog>>;
  setIsSyncing: (value: boolean) => void;
  setDataError: (message: string | null) => void;
  handleError: (context: string, error: unknown) => void;
};

const getNextColor = (existingJobs: Job[]): string => {
  const usedColors = new Set(existingJobs.map((job) => job.color));
  for (const color of JOB_COLORS) {
    if (!usedColors.has(color)) {
      return color;
    }
  }
  return JOB_COLORS[existingJobs.length % JOB_COLORS.length];
};

const buildNewJob = (existingJobs: Job[]): Job => {
  const color = getNextColor(existingJobs);
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `job_${Date.now()}`,
    name: `Job ${existingJobs.length + 1}`,
    payRate: NZ_MINIMUM_WAGE,
    color,
    includeHolidayPay: false,
  };
};

export const useWorkActions = ({
  user,
  jobs,
  workLog,
  setJobs,
  setWorkLog,
  setIsSyncing,
  setDataError,
  handleError,
}: Options) => {
  const addJob = useCallback(async () => {
    const newJob = buildNewJob(jobs);

    setJobs((prev) => [...prev, newJob]);
  }, [jobs, setJobs]);

  const saveJob = useCallback(
    async (id: string, updates: { name: string; payRate: number; includeHolidayPay: boolean }) => {
      const targetJob = jobs.find((job) => job.id === id);
      if (!targetJob) {
        return;
      }

      const updatedJob: Job = {
        ...targetJob,
        name: updates.name,
        payRate: updates.payRate,
        includeHolidayPay: updates.includeHolidayPay,
      };
      setJobs((prev) => prev.map((job) => (job.id === id ? updatedJob : job)));

      if (!user || !isSupabaseConfigured) {
        return;
      }

      setDataError(null);
      try {
        const savedJob = await upsertJob(user.id, updatedJob);
        setJobs((prev) => prev.map((job) => (job.id === id ? savedJob : job)));
      } catch (error) {
        handleError("작업 저장 실패", error);
        setJobs((prev) =>
          prev.map((job) => (job.id === id ? targetJob : job))
        );
      }
    },
    [jobs, setJobs, user, setDataError, handleError]
  );

  const deleteJob = useCallback(
    async (id: string) => {
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
        handleError("작업 삭제 실패", error);
        setJobs(previousJobs);
        setWorkLog(previousWorkLog);
      } finally {
        setIsSyncing(false);
      }
    },
    [
      jobs,
      workLog,
      setJobs,
      setWorkLog,
      user,
      setDataError,
      setIsSyncing,
      handleError,
    ]
  );

  const saveWorkLog = useCallback(
    async (date: Date, entries: WorkLogEntry[]) => {
      const dateStr = toYYYYMMDD(date);
      const previousWorkLog = cloneWorkLog(workLog);

      setWorkLog((prev) => {
        const newLog = { ...prev };
        if (entries.length > 0) {
          newLog[dateStr] = entries;
        } else {
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
        handleError("근무 기록 저장 실패", error);
        setWorkLog(previousWorkLog);
      } finally {
        setIsSyncing(false);
      }
    },
    [user, workLog, setWorkLog, setIsSyncing, setDataError, handleError]
  );

  return { addJob, saveJob, deleteJob, saveWorkLog };
};
