import React from "react";

type WeekNavigatorProps = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
};

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  label,
  onPrev,
  onNext,
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <button
        onClick={onPrev}
        className="px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
      >
        <span className="sm:hidden">&larr;</span>
        <span className="hidden sm:inline">&larr; Previous</span>
      </button>
      <h2 className="text-lg sm:text-xl font-bold text-center">{label}</h2>
      <button
        onClick={onNext}
        className="px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
      >
        <span className="sm:hidden">&rarr;</span>
        <span className="hidden sm:inline">Next &rarr;</span>
      </button>
    </div>
  );
};
