import React, { useState, useEffect } from 'react';
import { Job, WorkLogEntry } from '../types';

interface WorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  jobs: Job[];
  workLogForDay: WorkLogEntry[];
  onSave: (entries: WorkLogEntry[]) => void;
  holidayName?: string;
}

export const WorkLogModal: React.FC<WorkLogModalProps> = ({ isOpen, onClose, date, jobs, workLogForDay, onSave, holidayName }) => {
  const [entries, setEntries] = useState<WorkLogEntry[]>([]);

  useEffect(() => {
    const initialEntries = jobs.map(job => {
      const existingEntry = workLogForDay.find(w => w.jobId === job.id);
      return { jobId: job.id, hours: existingEntry?.hours || 0 };
    });
    setEntries(initialEntries);
  }, [isOpen, jobs, workLogForDay]);

  if (!isOpen) return null;

  const handleHourChange = (jobId: string, hours: number) => {
    setEntries(prev => prev.map(entry => entry.jobId === jobId ? { ...entry, hours: Math.max(0, hours) } : entry));
  };

  const handleSave = () => {
    // Filter out entries with 0 hours before saving
    onSave(entries.filter(e => e.hours > 0));
    onClose();
  };
  
  const handleClearDay = () => {
    onSave([]); // Save an empty array to clear the day
    onClose();
  };

  const totalHours = entries.reduce((acc, curr) => acc + curr.hours, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Log Hours</h2>
        <p className={`text-lg text-gray-600 ${holidayName ? 'mb-2' : 'mb-6'}`}>{date.toLocaleDateString('en-NZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        {holidayName && (
            <div className="mb-6">
                <span className="text-sm font-semibold text-red-700 bg-red-100 rounded-full px-3 py-1">
                    {holidayName}
                </span>
            </div>
        )}

        <div className="space-y-4">
          {jobs.map(job => {
            const entry = entries.find(e => e.jobId === job.id);
            return (
              <div key={job.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full ${job.color}`}></span>
                    <label htmlFor={`hours-${job.id}`} className="font-medium text-gray-700">{job.name}</label>
                </div>
                <input
                  id={`hours-${job.id}`}
                  type="number"
                  value={entry?.hours || ''}
                  onChange={(e) => handleHourChange(job.id, parseFloat(e.target.value) || 0)}
                  className="w-24 p-2 border rounded-md text-right bg-white text-gray-900"
                  placeholder="0"
                  step="0.25"
                />
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t flex justify-between items-center">
            <span className="font-bold text-lg">Total Hours:</span>
            <span className="font-bold text-lg">{totalHours.toFixed(2)}</span>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button 
            onClick={handleClearDay}
            disabled={totalHours === 0}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Clear Day
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};