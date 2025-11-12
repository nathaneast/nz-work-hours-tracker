import React, { useState, useEffect } from 'react';
import { Job, WorkLog, PayDetails, WorkLogEntry, Region } from './types';
import { Calendar } from './components/Calendar';
import { PaySummary } from './components/PaySummary';
import { JobEditor } from './components/JobEditor';
import { WorkLogModal } from './components/WorkLogModal';
import { calculateWeeklyPay } from './services/payCalculator';
import { NZ_MINIMUM_WAGE, JOB_COLORS, NZ_NATIONAL_HOLIDAYS, NZ_PROVINCIAL_HOLIDAYS, NZ_REGIONS } from './constants';
import { toYYYYMMDD, getStartOfWeek } from './utils';
import { PlusIcon } from './components/icons/PlusIcon';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRegion, setSelectedRegion] = useState<Region>('None');
  const [isRegionSelectorVisible, setIsRegionSelectorVisible] = useState(false);

  const [jobs, setJobs] = useState<Job[]>(() => {
    // Initial sample job
    return [{ id: 'job_1', name: 'Cafe Barista', payRate: NZ_MINIMUM_WAGE, color: JOB_COLORS[0] },
            { id: 'job_2', name: 'Farm Hand', payRate: 24.50, color: JOB_COLORS[1] }];
  });
  
  const [workLog, setWorkLog] = useState<WorkLog>(() => {
    // A fixed 40-hour, two-job example for the current week to showcase features.
    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    const sampleLog: WorkLog = {};

    // Monday: Full day at Job 1
    const monday = new Date(startOfWeek);
    monday.setUTCDate(startOfWeek.getUTCDate() + 0);
    sampleLog[toYYYYMMDD(monday)] = [{ jobId: 'job_1', hours: 8 }];

    // Tuesday: Full day at Job 2
    const tuesday = new Date(startOfWeek);
    tuesday.setUTCDate(startOfWeek.getUTCDate() + 1);
    sampleLog[toYYYYMMDD(tuesday)] = [{ jobId: 'job_2', hours: 8 }];

    // Wednesday: Split day
    const wednesday = new Date(startOfWeek);
    wednesday.setUTCDate(startOfWeek.getUTCDate() + 2);
    sampleLog[toYYYYMMDD(wednesday)] = [
      { jobId: 'job_1', hours: 4 },
      { jobId: 'job_2', hours: 4 },
    ];

    // Thursday: Split day
    const thursday = new Date(startOfWeek);
    thursday.setUTCDate(startOfWeek.getUTCDate() + 3);
    sampleLog[toYYYYMMDD(thursday)] = [
      { jobId: 'job_1', hours: 4 },
      { jobId: 'job_2', hours: 4 },
    ];
    
    // Friday: Full day at Job 1
    const friday = new Date(startOfWeek);
    friday.setUTCDate(startOfWeek.getUTCDate() + 4);
    sampleLog[toYYYYMMDD(friday)] = [{ jobId: 'job_1', hours: 8 }];

    return sampleLog;
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payDetails, setPayDetails] = useState<PayDetails>({
    grossPay: 0, tax: 0, accLevy: 0, netPay: 0, totalHours: 0, holidayHours: 0, jobBreakdown: []
  });

  const [editCount, setEditCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Combine national holidays with the selected regional holiday
  const allHolidays = React.useMemo(() => {
    if (selectedRegion === 'None') {
        return NZ_NATIONAL_HOLIDAYS;
    }
    const provincial = NZ_PROVINCIAL_HOLIDAYS.filter(h => h.region === selectedRegion);
    return [...NZ_NATIONAL_HOLIDAYS, ...provincial];
  }, [selectedRegion]);

  const holidayMap = React.useMemo(() => new Map(allHolidays.map(h => [h.date, h.name])), [allHolidays]);

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

  const handleSaveWorkLog = (entries: WorkLogEntry[]) => {
    if (selectedDate) {
      const dateStr = toYYYYMMDD(selectedDate);
       setWorkLog(prev => {
        const newLog = { ...prev };
        if (entries.length > 0) {
          newLog[dateStr] = entries;
        } else {
          // If entries are empty, remove the key from the worklog
          delete newLog[dateStr];
        }
        return newLog;
      });
      
      if(editCount < 3) {
        setEditCount(prev => prev + 1);
      } else if (!showLoginPrompt) {
        setShowLoginPrompt(true);
      }
    }
  };
  
  const changeWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setUTCDate(newDate.getUTCDate() + (direction === 'next' ? 7 : -7));
        return newDate;
    });
  };

  const holidayName = selectedDate ? holidayMap.get(toYYYYMMDD(selectedDate)) : undefined;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">NZ Work Hours Tracker</h1>
          <p className="text-secondary mt-2">Track your hours, estimate your weekly pay in New Zealand.</p>
        </header>

        {showLoginPrompt && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md mb-6" role="alert">
            <p className="font-bold">Save Your Data!</p>
            <p>You've made some changes. To save your work logs and jobs permanently, please log in.</p>
            <button className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">Sign in with Google (Demo)</button>
          </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-4 bg-white rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                  <button onClick={() => changeWeek('prev')} className="px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                    <span className="sm:hidden">&larr;</span>
                    <span className="hidden sm:inline">&larr; Previous</span>
                  </button>
                  <h2 className="text-lg sm:text-xl font-bold text-center">
                    {startOfWeek.toLocaleDateString('en-NZ', { month: 'long', day: 'numeric', timeZone: 'UTC' })} - {week[6].toLocaleDateString('en-NZ', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                  </h2>
                  <button onClick={() => changeWeek('next')} className="px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                    <span className="sm:hidden">&rarr;</span>
                    <span className="hidden sm:inline">Next &rarr;</span>
                  </button>
              </div>
              <Calendar week={week} workLog={workLog} jobs={jobs} onDayClick={handleDayClick} currentDate={currentDate} holidays={allHolidays} />
            </div>
             <div className="p-4 bg-white rounded-lg shadow-md">
                {!isRegionSelectorVisible ? (
                    <>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Provincial Holiday</h3>
                        <p className="text-sm text-gray-500 mt-1 mb-3">Optionally add your region's anniversary day for more accurate pay calculation.</p>
                        <button
                            onClick={() => setIsRegionSelectorVisible(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" /> Add Provincial Holiday
                        </button>
                    </>
                ) : (
                    <>
                        <label htmlFor="region-select" className="block text-lg font-medium text-gray-700 mb-2">Select Your Region</label>
                        <select
                            id="region-select"
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value as Region)}
                            className="w-full p-2 border rounded-md bg-white text-gray-900 focus:ring-primary focus:border-primary"
                            aria-label="Select your region to include provincial holidays"
                        >
                            {NZ_REGIONS.map(region => (
                            <option key={region} value={region}>{region === 'None' ? 'National Holidays Only' : `${region}`}</option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-500 mt-2">This adds your provincial anniversary day to the calendar for accurate pay calculation.</p>
                    </>
                )}
            </div>
            <JobEditor jobs={jobs} setJobs={setJobs} />
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