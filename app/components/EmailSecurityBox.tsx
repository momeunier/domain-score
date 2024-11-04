import { EmailSecurityData } from "../types";

interface EmailSecurityBoxProps {
  data: EmailSecurityData;
}

export default function EmailSecurityBox({ data }: EmailSecurityBoxProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm text-slate-700">
          SPF Record (Score: {data.spf.score}/50)
        </h3>
        {data.spf.exists ? (
          <>
            <p className="text-sm font-mono break-all text-slate-600 mt-2">
              {data.spf.record}
            </p>
            <div className="mt-2">
              <h4 className="text-sm font-medium text-slate-700">
                Score Breakdown:
              </h4>
              <ul className="mt-1 space-y-1">
                {data.spf.scoreDetails.map((detail, index) => (
                  <li key={index} className="text-sm text-slate-600">
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-sm text-red-500 mt-2">No SPF record found</p>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-sm text-slate-700">
          DMARC Record (Score: {data.dmarc.score}/50)
        </h3>
        {data.dmarc.exists ? (
          <>
            <p className="text-sm font-mono break-all text-slate-600 mt-2">
              {data.dmarc.record}
            </p>
            <div className="mt-2">
              <h4 className="text-sm font-medium text-slate-700">
                Score Breakdown:
              </h4>
              <ul className="mt-1 space-y-1">
                {data.dmarc.scoreDetails.map((detail, index) => (
                  <li key={index} className="text-sm text-slate-600">
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-sm text-red-500 mt-2">No DMARC record found</p>
        )}
      </div>
    </div>
  );
}
