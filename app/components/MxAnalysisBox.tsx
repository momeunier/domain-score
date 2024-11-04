import { MxAnalysisData } from "../types";

interface MxAnalysisBoxProps {
  data: MxAnalysisData;
}

export default function MxAnalysisBox({ data }: MxAnalysisBoxProps) {
  if (!data || !data.scoreDetails || !data.records) {
    return (
      <div className="text-sm text-slate-600">No MX records data available</div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm text-slate-700">
          Score Breakdown:
        </h3>
        <ul className="mt-2 space-y-1">
          {data.scoreDetails.map((detail, index) => (
            <li key={index} className="text-sm text-slate-600">
              {detail}
            </li>
          ))}
        </ul>
      </div>

      {data.records.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-slate-700">MX Records:</h3>
          <ul className="mt-2 space-y-1">
            {data.records.map((record, index) => (
              <li key={index} className="text-sm text-slate-600">
                Priority: {record.priority} - Server: {record.exchange}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
