import { JOB_COLORS, NZ_MINIMUM_WAGE } from "../constants";
import type { Job, WorkLog, WorkLogEntry } from "../types";
import { getStartOfWeek, toYYYYMMDD } from "../utils";

export const MOCK_JOBS: Job[] = [
  {
    id: "job_1",
    name: "Cafe Barista",
    payRate: NZ_MINIMUM_WAGE,
    color: JOB_COLORS[0],
  },
  { id: "job_2", name: "Farm Hand", payRate: 24.5, color: JOB_COLORS[1] },
];

export const createMockWorkLog = (): WorkLog => {
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

export const cloneWorkLog = (source: WorkLog): WorkLog => {
  const copy: WorkLog = {};
  Object.entries(source).forEach(([date, entries]) => {
    const typedEntries = entries as WorkLogEntry[];
    copy[date] = typedEntries.map((entry) => ({ ...entry }));
  });
  return copy;
};
