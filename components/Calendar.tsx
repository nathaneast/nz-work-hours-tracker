import React from 'react';
import { Job, WorkLog, Holiday } from '../types';
import { toYYYYMMDD, decimalHoursToHoursMinutes, calculateDailyNetPay } from '../utils';
import { ACC_LEVY_RATE } from '../constants';

interface CalendarProps {
  week: Date[];
  workLog: WorkLog;
  jobs: Job[];
  onDayClick: (date: Date) => void;
  currentDate: Date;
  holidays: Holiday[];
}

export const Calendar: React.FC<CalendarProps> = ({ week, workLog, jobs, onDayClick, currentDate, holidays }) => {
  
  const holidayMap = React.useMemo(() => new Map(holidays.map(h => [h.date, h.name])), [holidays]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {week.map(day => {
        const dateStr = toYYYYMMDD(day);
        const dayLog = workLog[dateStr] || [];
        const totalHours = dayLog.reduce((acc, entry) => acc + entry.hours, 0);
        const holiday = holidayMap.get(dateStr);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();

        return (
          <div
            key={dateStr}
            onClick={() => onDayClick(day)}
            className={`flex flex-col p-2 sm:p-3 border rounded-lg cursor-pointer transition-all duration-200 ease-in-out ${
              holiday ? 'bg-red-50 border-red-200' : (isToday(day) ? 'bg-accent border-secondary' : 'bg-white')
            } hover:shadow-lg hover:border-primary ${
              !isCurrentMonth ? 'text-gray-400 bg-gray-50' : 'text-gray-800'
            }`}
          >
            {/* Responsive Header: Stacked on mobile, row on desktop */}
            <div className="sm:flex sm:justify-between sm:items-center">
              <span className={`block text-center font-bold text-lg sm:text-left sm:text-base ${holiday ? 'text-red-600' : (isToday(day) ? 'text-primary' : '')}`}>{day.getDate()}</span>
              <span className="block text-center text-xs uppercase font-semibold text-gray-500 sm:text-right">{day.toLocaleString('en-US', { weekday: 'short' })}</span>
            </div>
            
            {holiday && <p className="text-xs text-red-600 mt-1 truncate text-center sm:text-left" title={holiday}>{holiday}</p>}
            
            {/* Use flex-grow to push dots to the bottom */}
            <div className="flex-grow mt-1 sm:mt-2 text-center flex flex-col justify-center min-h-[2rem]">
              {totalHours > 0 ? (() => {
                const { hours, minutes } = decimalHoursToHoursMinutes(totalHours);
                const dailyNetPay = calculateDailyNetPay(dayLog, jobs, !!holiday, ACC_LEVY_RATE);
                return (
                  <>
                    <p className="text-xs sm:text-base md:text-lg font-bold leading-none">{hours}h</p>
                    {minutes > 0 && (
                      <p className="text-xs sm:text-base md:text-lg font-bold leading-none mt-0.5">{minutes}m</p>
                    )}
                    {dailyNetPay > 0 && (
                      <p className="text-[9px] sm:text-[10px] text-red-600 font-medium leading-none mt-0.5">${dailyNetPay.toFixed(0)}</p>
                    )}
                  </>
                );
              })() : (
                <p className="text-xs sm:text-base md:text-lg font-bold">-</p>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-1 justify-center h-4">
              {dayLog.map(entry => {
                const job = jobs.find(j => j.id === entry.jobId);
                return job ? <span key={job.id} className={`block w-2 h-2 sm:w-3 sm:h-3 rounded-full ${job.color}`} title={`${job.name}: ${entry.hours}h`}></span> : null;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};