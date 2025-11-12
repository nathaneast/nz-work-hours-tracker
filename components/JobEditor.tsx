import React from 'react';
import { Job } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { NZ_MINIMUM_WAGE, JOB_COLORS } from '../constants';

interface JobEditorProps {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}

export const JobEditor: React.FC<JobEditorProps> = ({ jobs, setJobs }) => {
  
  const addJob = () => {
    const newJob: Job = {
      id: `job_${Date.now()}`,
      name: `Job ${jobs.length + 1}`,
      payRate: NZ_MINIMUM_WAGE,
      color: JOB_COLORS[jobs.length % JOB_COLORS.length],
    };
    setJobs([...jobs, newJob]);
  };

  const updateJob = (id: string, field: keyof Job, value: string | number) => {
    setJobs(jobs.map(job => job.id === id ? { ...job, [field]: value } : job));
  };
  
  const deleteJob = (id: string) => {
    setJobs(jobs.filter(job => job.id !== id));
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Manage Jobs</h2>
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3 rounded-md border">
            
            {/* Job Name: Full width on mobile, flexible on larger screens */}
            <div className="flex w-full sm:w-auto sm:flex-1 items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${job.color} flex-shrink-0`}></span>
              <input
                type="text"
                value={job.name}
                onChange={(e) => updateJob(job.id, 'name', e.target.value)}
                className="font-semibold p-2 border rounded-md w-full bg-white text-gray-900"
                aria-label={`Job name for ${job.name}`}
              />
            </div>
            
            {/* Pay Rate: Takes remaining space on its line */}
            <div className="flex flex-1 items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={job.payRate}
                onChange={(e) => updateJob(job.id, 'payRate', parseFloat(e.target.value) || 0)}
                className="p-2 border rounded-md w-full bg-white text-gray-900"
                step="0.01"
                aria-label={`Pay rate for ${job.name}`}
              />
              <span className="text-gray-500 text-nowrap">/ hour</span>
            </div>

            {/* Actions Section: Aligns to the end of the pay rate line on mobile */}
            <div className="flex-shrink-0">
              <button 
                onClick={() => deleteJob(job.id)} 
                className="text-red-500 hover:text-red-700 p-2"
                aria-label={`Delete job ${job.name}`}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
       <button 
        onClick={addJob} 
        disabled={jobs.length >= 5}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary disabled:bg-gray-400 transition-colors"
      >
        <PlusIcon className="w-5 h-5" /> Add Job
      </button>
    </div>
  );
};