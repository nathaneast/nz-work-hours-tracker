import React from 'react';
import { PayDetails } from '../types';

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
  const { grossPay, tax, accLevy, netPay, totalHours, holidayHours, jobBreakdown } = payDetails;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Estimated Weekly Pay</h2>
        <div className="space-y-2">
            <SummaryRow label="Total Hours" value={`${totalHours.toFixed(2)} hrs`} />
            {holidayHours > 0 && <SummaryRow label="Public Holiday Hours" value={`${holidayHours.toFixed(2)} hrs`} />}
            
            {jobBreakdown && jobBreakdown.length > 1 && (
                <div className="pt-2 mt-2 border-t">
                    <h3 className="text-md font-semibold text-gray-700 mt-2 mb-1">Job Breakdown (Gross)</h3>
                    <div className="space-y-1 pl-1">
                        {jobBreakdown.map(job => (
                            <div key={job.jobId} className="flex justify-between items-center text-sm p-1 rounded">
                                <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${job.jobColor}`}></span>
                                    <span className="text-gray-600">{job.jobName} ({job.totalHours.toFixed(1)}h)</span>
                                </div>
                                <span className="font-medium text-gray-800">${job.grossPay.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <hr className="my-2" />
            <SummaryRow label="Gross Pay" value={`$${grossPay.toFixed(2)}`} isBold />
            <SummaryRow label="PAYE Tax (Est.)" value={`-$${tax.toFixed(2)}`} className="text-red-600" />
            <SummaryRow label="ACC Levy (Est.)" value={`-$${accLevy.toFixed(2)}`} className="text-red-600" />
            <hr className="my-2 border-dashed" />
            <SummaryRow label="Net Pay (Take Home)" value={`$${netPay.toFixed(2)}`} isBold className="text-2xl text-primary" />
        </div>
    </div>
  );
};