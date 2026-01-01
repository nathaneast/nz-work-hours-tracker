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
          value={(() => {
            const { hours, minutes } = decimalHoursToHoursMinutes(totalHours);
            const hoursMinutesStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
            return minutes > 0
              ? `${hoursMinutesStr} (${totalHours.toFixed(2)})`
              : hoursMinutesStr;
          })()}
        />
        {holidayHours > 0 && (
          <SummaryRow
            label="Public Holiday Hours"
            value={(() => {
              const { hours, minutes } = decimalHoursToHoursMinutes(holidayHours);
              const hoursMinutesStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
              return minutes > 0
                ? `${hoursMinutesStr} (${holidayHours.toFixed(2)})`
                : hoursMinutesStr;
            })()}
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
                  className="flex justify-between items-center text-sm p-1 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${job.jobColor}`}
                    ></span>
                    <div className="flex flex-col">
                      <span className="text-gray-600">
                        {job.jobName} {(() => {
                          const { hours, minutes } = decimalHoursToHoursMinutes(job.totalHours);
                          const hoursMinutesStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
                          return minutes > 0
                            ? `${hoursMinutesStr} (${job.totalHours.toFixed(
                                2
                              )})`
                            : hoursMinutesStr;
                        })()}
                      </span>
                      {job.includeHolidayPay && job.holidayPay > 0 && (
                        <span className="text-xs text-blue-600">
                          ✓ Holiday Pay (8%): ${job.holidayPay.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-gray-800">
                      ${job.grossPay.toFixed(2)}
                    </span>
                    {job.includeHolidayPay && job.holidayPay > 0 && (
                      <span className="text-xs text-gray-500">
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
        <SummaryRow
          label="Net Pay (Take Home)"
          value={`$${netPay.toFixed(2)}`}
          isBold
          className="text-2xl text-primary"
        />
      </div>
    </div>
  );
};