import React from 'react';
import { Job } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from "./icons/TrashIcon";

interface JobEditorProps {
  jobs: Job[];
  onAddJob: () => Promise<void> | void;
  onUpdateJob: (
    id: string,
    field: keyof Job,
    value: string | number
  ) => Promise<void> | void;
  onDeleteJob: (id: string) => Promise<void> | void;
  disabled?: boolean;
  isAuthenticated: boolean;
}

export const JobEditor: React.FC<JobEditorProps> = ({
  jobs,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  disabled = false,
  isAuthenticated,
}) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Manage Jobs</h2>
        {!isAuthenticated && (
          <span className="text-xs text-gray-500">
            로그인하면 작업이 저장됩니다.
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
                value={job.name}
                onChange={(e) => onUpdateJob(job.id, "name", e.target.value)}
                disabled={disabled}
                className="font-semibold p-2 border rounded-md w-full bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                aria-label={`Job name for ${job.name}`}
              />
            </div>

            {/* Pay Rate: Takes remaining space on its line */}
            <div className="flex flex-1 items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={job.payRate}
                onChange={(e) =>
                  onUpdateJob(
                    job.id,
                    "payRate",
                    parseFloat(e.target.value) || 0
                  )
                }
                disabled={disabled}
                className="p-2 border rounded-md w-full bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                step="0.01"
                aria-label={`Pay rate for ${job.name}`}
              />
              <span className="text-gray-500 text-nowrap">/ hour</span>
            </div>

            {/* Actions Section: Aligns to the end of the pay rate line on mobile */}
            <div className="flex-shrink-0">
              <button
                onClick={() => onDeleteJob(job.id)}
                disabled={disabled}
                className="text-red-500 hover:text-red-700 p-2 disabled:text-gray-300 disabled:cursor-not-allowed"
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