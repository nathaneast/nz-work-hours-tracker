import React from "react";
import type { Region } from "../types";
import { PlusIcon } from "./icons/PlusIcon";

type RegionSelectorCardProps = {
  isVisible: boolean;
  selectedRegion: Region;
  regions: Region[];
  onSelectRegion: (region: Region) => void;
  onRevealSelector: () => void;
};

export const RegionSelectorCard: React.FC<RegionSelectorCardProps> = ({
  isVisible,
  selectedRegion,
  regions,
  onSelectRegion,
  onRevealSelector,
}) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {isVisible ? (
        <>
          <label
            htmlFor="region-select"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            Select Your Region
          </label>
          <select
            id="region-select"
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value as Region)}
            className="w-full p-2 border rounded-md bg-white text-gray-900 focus:ring-primary focus:border-primary"
            aria-label="Select your region to include provincial holidays"
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region === "None" ? "National Holidays Only" : `${region}`}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-2">
            This adds your provincial anniversary day to the calendar for
            accurate pay calculation.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Provincial Holiday
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-3">
            Optionally add your region's anniversary day for more accurate pay
            calculation.
          </p>
          <button
            onClick={onRevealSelector}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
          >
            <PlusIcon className="w-5 h-5" /> Add Provincial Holiday
          </button>
        </>
      )}
    </div>
  );
};
