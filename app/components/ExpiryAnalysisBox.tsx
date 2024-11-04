interface ExpiryAnalysisBoxProps {
  data: {
    aiAnalysis: {
      expiry: string;
    };
    expiryScore: {
      score: number;
      message: string;
      daysUntilExpiry: number;
    };
  };
}

export default function ExpiryAnalysisBox({ data }: ExpiryAnalysisBoxProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm text-slate-700">Details:</h3>
        <ul className="mt-2 space-y-2">
          <li className="text-sm text-slate-600">
            <span className="font-medium">Expiry Date:</span>{" "}
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
              {data.aiAnalysis.expiry}
            </span>
          </li>
          <li className="text-sm text-slate-600">
            <span className="font-medium">Days until expiry:</span>{" "}
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
              {data.expiryScore.daysUntilExpiry} days
            </span>
          </li>
          <li className="text-sm text-slate-600">
            <span className="font-medium">Status:</span>{" "}
            <span
              className={`${
                data.expiryScore.score >= 80
                  ? "text-green-600"
                  : data.expiryScore.score >= 50
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {data.expiryScore.message}
            </span>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-slate-700">
          Score Breakdown:
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Score is based on the number of days until expiry:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>• 100 points: More than 6 months</li>
          <li>• 75 points: Between 1-6 months</li>
          <li>• 50 points: Between 7-30 days</li>
          <li>• 25 points: Less than 7 days</li>
          <li>• 0 points: Less than 24 hours</li>
        </ul>
      </div>
    </div>
  );
}
