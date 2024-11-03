"use client";
import { useState } from "react";
import DomainForm from "./components/DomainForm";
import ScoreBox from "./components/ScoreBox";

interface ValidationResult {
  domain: string;
  isValid: boolean;
  score: number;
  message: string;
}

interface WhoisResult {
  domain: string;
  whoisData: string;
}

interface Results {
  validation?: ValidationResult;
  mxAnalysis?: {
    hasMxRecords: boolean;
    hasMultipleMx: boolean;
    hasDifferentWeights: boolean;
    onSameDomain: boolean;
    records: Array<{
      priority: number;
      exchange: string;
    }>;
    details: string[];
    score: number;
    scoreDetails: string[];
  };
  emailSecurity?: {
    spf: {
      exists: boolean;
      record: string | null;
      details: string[];
      score: number;
      scoreDetails: string[];
    };
    dmarc: {
      exists: boolean;
      record: string | null;
      details: string[];
      score: number;
      scoreDetails: string[];
    };
    totalScore: number;
  };
}

export default function Home() {
  const [results, setResults] = useState<Results>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (domain: string) => {
    setLoading(true);
    setResults({});

    try {
      // Domain Validation
      const validationRes = await fetch("/api/domain-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const validationData = await validationRes.json();
      setResults((prev) => ({ ...prev, validation: validationData }));

      if (validationData.isValid) {
        // MX Check
        const mxRes = await fetch("/api/mx-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });
        const mxData = await mxRes.json();
        setResults((prev) => ({ ...prev, mxAnalysis: mxData }));

        // Email Security Check
        const securityRes = await fetch("/api/email-security", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });
        const securityData = await securityRes.json();
        setResults((prev) => ({ ...prev, emailSecurity: securityData }));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-slate-800">
          Domain Score Calculator
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <DomainForm onSubmit={handleSubmit} />
        </div>

        {loading && (
          <div className="text-slate-600 p-4 text-center">Loading...</div>
        )}

        {results.validation && (
          <ScoreBox title="Domain Validation" score={results.validation.score}>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-700">
                  Details:
                </h3>
                <ul className="mt-2 space-y-1">
                  <li className="text-sm text-slate-600">
                    Valid: {results.validation.isValid ? "Yes" : "No"}
                  </li>
                  <li className="text-sm text-slate-600">
                    Message: {results.validation.message}
                  </li>
                </ul>
              </div>
            </div>
          </ScoreBox>
        )}

        {results.mxAnalysis && (
          <ScoreBox
            title="MX Records Analysis"
            score={results.mxAnalysis.score}
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-700">
                  Score Breakdown:
                </h3>
                <ul className="mt-2 space-y-1">
                  {results.mxAnalysis.scoreDetails.map((detail, index) => (
                    <li key={index} className="text-sm text-slate-600">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {results.mxAnalysis.records.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-slate-700">
                    MX Records:
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {results.mxAnalysis.records.map((record, index) => (
                      <li key={index} className="text-sm text-slate-600">
                        Priority: {record.priority} - Server: {record.exchange}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScoreBox>
        )}

        {results.emailSecurity && (
          <ScoreBox
            title="Email Security Analysis"
            score={results.emailSecurity.totalScore}
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-700">
                  SPF Record (Score: {results.emailSecurity.spf.score}/50)
                </h3>
                {results.emailSecurity.spf.exists ? (
                  <>
                    <p className="text-sm font-mono bg-slate-100 p-2 rounded mt-2 text-slate-700">
                      {results.emailSecurity.spf.record}
                    </p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-slate-700">
                        Score Breakdown:
                      </h4>
                      <ul className="mt-1 space-y-1">
                        {results.emailSecurity.spf.scoreDetails.map(
                          (detail, index) => (
                            <li key={index} className="text-sm text-slate-600">
                              {detail}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-red-600 mt-2">
                    No SPF record found
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-sm text-slate-700">
                  DMARC Record (Score: {results.emailSecurity.dmarc.score}/50)
                </h3>
                {results.emailSecurity.dmarc.exists ? (
                  <>
                    <p className="text-sm font-mono bg-slate-100 p-2 rounded mt-2 text-slate-700">
                      {results.emailSecurity.dmarc.record}
                    </p>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-slate-700">
                        Score Breakdown:
                      </h4>
                      <ul className="mt-1 space-y-1">
                        {results.emailSecurity.dmarc.scoreDetails.map(
                          (detail, index) => (
                            <li key={index} className="text-sm text-slate-600">
                              {detail}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-red-600 mt-2">
                    No DMARC record found
                  </p>
                )}
              </div>
            </div>
          </ScoreBox>
        )}
      </div>
    </div>
  );
}
