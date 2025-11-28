"use client";

import { Calendar, Download } from "lucide-react";

interface VATDeadlineAlertProps {
  daysToDeadline: number;
}

export default function VATDeadlineAlert({ daysToDeadline }: VATDeadlineAlertProps) {
  return (
    <div className={`rounded-2xl border-2 p-6 ${daysToDeadline <= 7 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
      <div className="flex items-start gap-4">
        <Calendar className={`h-6 w-6 mt-0.5 flex-shrink-0 ${daysToDeadline <= 7 ? "text-red-600" : "text-amber-600"}`} />
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${daysToDeadline <= 7 ? "text-red-900" : "text-amber-900"}`}>
            VAT Payment Deadline
          </h3>
          <p className={`text-sm mt-1 ${daysToDeadline <= 7 ? "text-red-700" : "text-amber-700"}`}>
            {daysToDeadline === 0 ? (
              <span className="font-bold">Due today!</span>
            ) : daysToDeadline === 1 ? (
              <span className="font-bold">Due tomorrow</span>
            ) : (
              <>Due in <span className="font-bold">{daysToDeadline} days</span> (21st of next month)</>
            )}
          </p>
          <p className="text-xs mt-2 opacity-75">
            Remember to file your VAT return before the deadline to avoid penalties.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 font-medium transition">
          <Download className="h-4 w-4" /> Export Report
        </button>
      </div>
    </div>
  );
}
