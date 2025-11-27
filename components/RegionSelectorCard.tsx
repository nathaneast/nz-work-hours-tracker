import React from "react";
import type { Region } from "../types";
import { PlusIcon } from "./icons/PlusIcon";

type RegionPersistOptions = {
  isSaving: boolean;
  isDirty: boolean;
  isLoading: boolean;
  onSave: () => void;
};

type RegionSelectorCardProps = {
  isVisible: boolean;
  selectedRegion: Region;
  regions: Region[];
  onSelectRegion: (region: Region) => void;
  onRevealSelector: () => void;
  persistOptions?: RegionPersistOptions;
};

export const RegionSelectorCard: React.FC<RegionSelectorCardProps> = ({
  isVisible,
  selectedRegion,
  regions,
  onSelectRegion,
  onRevealSelector,
  persistOptions,
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
          {persistOptions && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={persistOptions.onSave}
                disabled={
                  persistOptions.isSaving ||
                  !persistOptions.isDirty ||
                  persistOptions.isLoading
                }
                className="px-3 py-1.5 text-sm rounded-md bg-secondary text-white hover:bg-primary disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
              >
                {persistOptions.isSaving ? "Saving…" : "Save default region"}
              </button>
              <span className="text-xs text-gray-600">
                {persistOptions.isDirty
                  ? "Unsaved default region change."
                  : "Default region saved."}
              </span>
            </div>
          )}
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
