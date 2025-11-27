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

const buildNewJob = (existingJobs: Job[]): Job => {
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
      handleError("작업 추가 실패", error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, jobs, setJobs, setDataError, setIsSyncing, handleError]);

  const updateJob = useCallback(
    async (id: string, field: keyof Job, value: string | number) => {
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
        handleError("작업 수정 실패", error);
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

  return { addJob, updateJob, deleteJob, saveWorkLog };
};
