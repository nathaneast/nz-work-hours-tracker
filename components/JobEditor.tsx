import React, { useEffect, useState } from 'react';
import { Job } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from "./icons/TrashIcon";
import { PencilIcon } from "./icons/PencilIcon";

interface JobEditorProps {
  jobs: Job[];
  onAddJob: () => Promise<void> | void;
  onSaveJob: (
    id: string,
    updates: { name: string; payRate: number; includeHolidayPay: boolean }
  ) => Promise<void> | void;
  onDeleteJob: (id: string) => Promise<void> | void;
  disabled?: boolean;
  isAuthenticated: boolean;
}

export const JobEditor: React.FC<JobEditorProps> = ({
  jobs,
  onAddJob,
  onSaveJob,
  onDeleteJob,
  disabled = false,
  isAuthenticated,
}) => {
  const [draftRates, setDraftRates] = useState<Record<string, string>>({});
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [draftIncludeHolidayPay, setDraftIncludeHolidayPay] = useState<Record<string, boolean>>({});
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  useEffect(() => {
    setDraftRates((prev) => {
      const next: Record<string, string> = {};
      jobs.forEach((job) => {
        next[job.id] =
          prev[job.id] !== undefined ? prev[job.id] : job.payRate.toString();
      });
      return next;
    });
    setDraftNames((prev) => {
      const next: Record<string, string> = {};
      jobs.forEach((job) => {
        next[job.id] = prev[job.id] ?? job.name;
      });
      return next;
    });
    setDraftIncludeHolidayPay((prev) => {
      const next: Record<string, boolean> = {};
      jobs.forEach((job) => {
        next[job.id] = prev[job.id] !== undefined ? prev[job.id] : job.includeHolidayPay;
      });
      return next;
    });
  }, [jobs]);

  const handleRateChange = (id: string, value: string) => {
    setDraftRates((prev) => ({ ...prev, [id]: value }));
  };

  const handleRateBlur = (id: string) => {
    const raw = draftRates[id];
    const parsed = Number(raw);
    const nextValue = Number.isNaN(parsed) ? 0 : parsed;
    setDraftRates((prev) => ({
      ...prev,
      [id]: nextValue.toString(),
    }));
  };

  const handleNameChange = (id: string, value: string) => {
    setDraftNames((prev) => ({ ...prev, [id]: value }));
  };

  const handleNameBlur = (id: string) => {
    const currentValue = draftNames[id] ?? "";
    setDraftNames((prev) => ({ ...prev, [id]: currentValue }));
  };

  const hasPendingChanges = (job: Job) => {
    const nameDraft = draftNames[job.id] ?? job.name;
    const rateDraft = draftRates[job.id] ?? job.payRate.toString();
    const rateValue = Number(rateDraft);
    const includeHolidayPayDraft = draftIncludeHolidayPay[job.id] ?? job.includeHolidayPay;
    return (
      nameDraft !== job.name ||
      (Number.isNaN(rateValue) ? 0 : rateValue) !== job.payRate ||
      includeHolidayPayDraft !== job.includeHolidayPay
    );
  };

  const handleSaveJob = async (job: Job) => {
    if (disabled) {
      return;
    }
    const nameDraft = (draftNames[job.id] ?? job.name).trim() || "Untitled Job";
    const rateDraft = draftRates[job.id] ?? job.payRate.toString();
    const nextRate = Number(rateDraft);
    const sanitizedRate = Number.isNaN(nextRate) ? 0 : nextRate;
    const includeHolidayPayDraft = draftIncludeHolidayPay[job.id] ?? job.includeHolidayPay;

    setSavingJobId(job.id);
    try {
      await onSaveJob(job.id, { 
        name: nameDraft, 
        payRate: sanitizedRate,
        includeHolidayPay: includeHolidayPayDraft,
      });
      setDraftNames((prev) => ({ ...prev, [job.id]: nameDraft }));
      setDraftRates((prev) => ({
        ...prev,
        [job.id]: sanitizedRate.toString(),
      }));
      setDraftIncludeHolidayPay((prev) => ({
        ...prev,
        [job.id]: includeHolidayPayDraft,
      }));
    } finally {
      setSavingJobId(null);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Manage Jobs</h2>
        {!isAuthenticated && (
          <span className="text-xs font-semibold text-yellow-800 bg-yellow-100 px-3 py-1 rounded-full">
            Sign in to save your jobs securely.
          </span>
        )}
      </div>
      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3 rounded-md border"
          >
            {/* Job Name: Full width on mobile, flexible on larger screens */}
            <div className="flex w-full sm:w-auto sm:flex-1 items-center gap-2">
              <span
                className={`w-4 h-4 rounded-full ${job.color} flex-shrink-0`}
              ></span>
              <input
                type="text"
                value={draftNames[job.id] ?? job.name}
                onChange={(e) => handleNameChange(job.id, e.target.value)}
                onBlur={() => handleNameBlur(job.id)}
                disabled={disabled}
                className="font-semibold p-2 border rounded-md w-full bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                aria-label={`Job name for ${job.name}`}
              />
            </div>

            {/* Pay Rate: Full width on mobile */}
            <div className="flex w-full sm:flex-1 items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={draftRates[job.id] ?? job.payRate.toString()}
                onChange={(e) => handleRateChange(job.id, e.target.value)}
                onBlur={() => handleRateBlur(job.id)}
                disabled={disabled}
                className="p-2 border rounded-md flex-1 min-w-0 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                aria-label={`Pay rate for ${job.name}`}
              />
              <span className="text-gray-500 text-nowrap">/ hour</span>
            </div>

            {/* Holiday Pay, Save, Delete: All in one row (mobile-first) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full mt-2">
              <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={
                    draftIncludeHolidayPay[job.id] ?? job.includeHolidayPay
                  }
                  onChange={(e) =>
                    setDraftIncludeHolidayPay((prev) => ({
                      ...prev,
                      [job.id]: e.target.checked,
                    }))
                  }
                  disabled={disabled}
                  className="w-4 h-4 text-secondary border-gray-300 rounded focus:ring-secondary flex-shrink-0"
                />
                <span className="text-sm text-gray-700 whitespace-nowrap">
                  Holiday Pay
                </span>
              </label>
              <button
                onClick={() => handleSaveJob(job)}
                disabled={
                  disabled || savingJobId === job.id || !hasPendingChanges(job)
                }
                className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex-shrink-0"
              >
                {savingJobId === job.id ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => onDeleteJob(job.id)}
                disabled={disabled}
                className="text-red-500 hover:text-red-700 p-1.5 disabled:text-gray-300 disabled:cursor-not-allowed flex-shrink-0"
                aria-label={`Delete job ${job.name}`}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onAddJob}
        disabled={disabled || jobs.length >= 5}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <PlusIcon className="w-5 h-5" /> Add Job
      </button>
    </div>
  );
};
