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

//interface WhoisResult {
//  domain: string;
//  whoisData: string;
//}

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
  aiAnalysis?: {
    expiry: string | null;
  };
  expiryScore?: {
    score: number;
    message: string;
    daysUntilExpiry: number | null;
  };
}

export default function Home() {
  const [results, setResults] = useState<Results>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (domain: string) => {
    setLoading(true);
    setResults({});

    try {
      // Domain Validation first as we need to know if the domain is valid
      const validationRes = await fetch("/api/domain-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const validationData = await validationRes.json();
      setResults((prev) => ({ ...prev, validation: validationData }));

      if (validationData.isValid) {
        // Start the WHOIS and OpenAI analysis immediately
        const expiryAnalysisPromise = (async () => {
          const whoisRes = await fetch("/api/whois", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
          });
          const whoisData = await whoisRes.json();

          const aiRes = await fetch("/api/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ whoisData: whoisData.whoisData }),
          });
          const aiData = await aiRes.json();
          setResults((prev) => ({ ...prev, aiAnalysis: aiData }));

          if (aiData.expiry) {
            const expiryScoreRes = await fetch("/api/expiry-score", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(aiData),
            });
            const expiryScoreData = await expiryScoreRes.json();
            setResults((prev) => ({ ...prev, expiryScore: expiryScoreData }));
          }
        })();

        // Run other checks in parallel
        const otherChecksPromise = (async () => {
          const [mxData, securityData] = await Promise.all([
            // MX Check
            fetch("/api/mx-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain }),
            }).then((res) => res.json()),

            // Email Security Check
            fetch("/api/email-security", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain }),
            }).then((res) => res.json()),
          ]);

          setResults((prev) => ({
            ...prev,
            mxAnalysis: mxData,
            emailSecurity: securityData,
          }));
        })();

        // Wait for all checks to complete
        await Promise.all([expiryAnalysisPromise, otherChecksPromise]);
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

        {results.expiryScore && (
          <ScoreBox
            title="Domain Expiry Analysis"
            score={results.expiryScore.score}
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-slate-700">
                  Details:
                </h3>
                <ul className="mt-2 space-y-2">
                  <li className="text-sm text-slate-600">
                    <span className="font-medium">Expiry Date:</span>{" "}
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {results.aiAnalysis?.expiry}
                    </span>
                  </li>
                  <li className="text-sm text-slate-600">
                    <span className="font-medium">Days until expiry:</span>{" "}
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {results.expiryScore.daysUntilExpiry} days
                    </span>
                  </li>
                  <li className="text-sm text-slate-600">
                    <span className="font-medium">Status:</span>{" "}
                    <span
                      className={`${
                        results.expiryScore.score >= 80
                          ? "text-green-600"
                          : results.expiryScore.score >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {results.expiryScore.message}
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
          </ScoreBox>
        )}
      </div>
    </div>
  );
}
