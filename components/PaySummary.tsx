import React from 'react';
import { PayDetails } from '../types';
import { decimalHoursToHoursMinutes } from '../utils';

interface PaySummaryProps {
  payDetails: PayDetails;
}

const SummaryRow: React.FC<{ label: string; value: string; isBold?: boolean; className?: string }> = ({ label, value, isBold = false, className = '' }) => (
    <div className={`flex justify-between items-center py-2 ${className}`}>
        <span className={`text-gray-600 ${isBold ? 'font-semibold' : ''}`}>{label}</span>
        <span className={`text-gray-900 ${isBold ? 'font-bold' : ''}`}>{value}</span>
    </div>
);

// Helper function to format hours with decimal notation
const formatHoursWithDecimal = (totalHours: number): string => {
  const { hours, minutes } = decimalHoursToHoursMinutes(totalHours);
  const hoursMinutesStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return minutes > 0 ? `${hoursMinutesStr} (${totalHours.toFixed(2)})` : hoursMinutesStr;
};

export const PaySummary: React.FC<PaySummaryProps> = ({ payDetails }) => {
  const {
    grossPay,
    ordinaryPay,
    publicHolidayPremium,
    holidayPay,
    tax,
    accLevy,
    netPay,
    totalHours,
    holidayHours,
    jobBreakdown,
  } = payDetails;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Estimated Weekly Pay
      </h2>
      <div className="space-y-2">
        <SummaryRow
          label="Total Hours"
          value={formatHoursWithDecimal(totalHours)}
        />
        {holidayHours > 0 && (
          <SummaryRow
            label="Public Holiday Hours"
            value={formatHoursWithDecimal(holidayHours)}
          />
        )}

        {jobBreakdown && jobBreakdown.length > 1 && (
          <div className="pt-2 mt-2 border-t">
            <h3 className="text-md font-semibold text-gray-700 mt-2 mb-1">
              Job Breakdown (Gross)
            </h3>
            <div className="space-y-1 pl-1">
              {jobBreakdown.map((job) => (
                <div
                  key={job.jobId}
                  className="flex justify-between items-start text-sm p-1 rounded gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`w-3 h-3 rounded-full ${job.jobColor} flex-shrink-0`}
                    ></span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-gray-600">
                        {job.jobName} {formatHoursWithDecimal(job.totalHours)}
                      </span>
                      {job.includeHolidayPay && job.holidayPay > 0 && (
                        <span className="text-xs text-blue-600">
                          ✓ Holiday Pay (8%): ${job.holidayPay.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="font-medium text-gray-800 whitespace-nowrap">
                      ${job.grossPay.toFixed(2)}
                    </span>
                    {job.includeHolidayPay && job.holidayPay > 0 && (
                      <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                        (${job.ordinaryPay.toFixed(2)} + $
                        {job.holidayPay.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr className="my-2" />
        <SummaryRow label="Ordinary Pay" value={`$${ordinaryPay.toFixed(2)}`} />
        {publicHolidayPremium > 0 && (
          <SummaryRow
            label="Public Holiday Premium (1.5×)"
            value={`$${publicHolidayPremium.toFixed(2)}`}
            className="text-green-600"
          />
        )}
        {holidayPay > 0 && (
          <SummaryRow
            label="Holiday Pay (8%)"
            value={`$${holidayPay.toFixed(2)}`}
            className="text-blue-600"
          />
        )}
        <SummaryRow
          label="Gross Pay"
          value={`$${grossPay.toFixed(2)}`}
          isBold
        />
        <SummaryRow
          label="PAYE Tax (Est.)"
          value={`-$${tax.toFixed(2)}`}
          className="text-red-600"
        />
        <SummaryRow
          label="ACC Levy (Est.)"
          value={`-$${accLevy.toFixed(2)}`}
          className="text-red-600"
        />
        <hr className="my-2 border-dashed" />
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600 font-semibold">
            Net Pay
            <br className="sm:hidden" />
            <span className="sm:inline hidden"> </span>(Take Home)
          </span>
          <span className="text-gray-900 font-bold text-xl sm:text-2xl text-primary">
            ${netPay.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};