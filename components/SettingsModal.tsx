import React, { useState, useEffect } from 'react';

export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeekStartDay: WeekStartDay;
  onSave: (weekStartDay: WeekStartDay) => void;
}

const WEEK_DAY_OPTIONS: { value: WeekStartDay; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialWeekStartDay,
  onSave,
}) => {
  const [weekStartDay, setWeekStartDay] = useState<WeekStartDay>(initialWeekStartDay);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWeekStartDay(initialWeekStartDay);
    }
  }, [isOpen, initialWeekStartDay]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      onSave(weekStartDay);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save settings', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Settings</h2>

        <div className="space-y-6">
          {/* Week Start Day */}
          <div>
            <label htmlFor="week-start-day" className="block text-sm font-medium text-gray-700 mb-2">
              Week Start Day
            </label>
            <select
              id="week-start-day"
              value={weekStartDay}
              onChange={(e) => setWeekStartDay(parseInt(e.target.value) as WeekStartDay)}
              className="w-full p-2 border rounded-md bg-white text-gray-900 disabled:bg-gray-100"
              disabled={isSaving}
            >
              {WEEK_DAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select which day your week starts on
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

