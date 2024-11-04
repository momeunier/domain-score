"use client";
import { useState } from "react";
import DomainForm from "./components/DomainForm";
import ScoreBox from "./components/ScoreBox";
import ValidationBox from "./components/ValidationBox";
import MxAnalysisBox from "./components/MxAnalysisBox";
import EmailSecurityBox from "./components/EmailSecurityBox";
import ExpiryAnalysisBox from "./components/ExpiryAnalysisBox";
import { Results } from "./types";

export default function Home() {
  const [results, setResults] = useState<Results>({});

  const handleSubmit = async (domain: string) => {
    // Initialize all analyses as loading
    setResults({
      validation: { loading: true },
      mxAnalysis: { loading: true },
      emailSecurity: { loading: true },
      expiryAnalysis: { loading: true },
    });

    try {
      // Domain Validation
      try {
        const validationRes = await fetch("/api/domain-validation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });
        const validationData = await validationRes.json();
        setResults((prev) => ({
          ...prev,
          validation: { loading: false, data: validationData },
        }));

        if (validationData.isValid) {
          // Start expiry analysis immediately
          const expiryPromise = (async () => {
            try {
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

              if (aiData.expiry) {
                const expiryScoreRes = await fetch("/api/expiry-score", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(aiData),
                });
                const expiryScoreData = await expiryScoreRes.json();
                setResults((prev) => ({
                  ...prev,
                  expiryAnalysis: {
                    loading: false,
                    data: { aiAnalysis: aiData, expiryScore: expiryScoreData },
                  },
                }));
              }
            } catch (error) {
              console.error("Error:", error);
              setResults((prev) => ({
                ...prev,
                expiryAnalysis: {
                  loading: false,
                  error: "Failed to analyze domain expiry",
                },
              }));
            }
          })();

          // Run all checks in parallel
          await Promise.all([
            expiryPromise,
            // MX Check
            fetch("/api/mx-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain }),
            })
              .then((res) => res.json())
              .then((data) => {
                setResults((prev) => ({
                  ...prev,
                  mxAnalysis: { loading: false, data },
                }));
              })
              .catch(() => {
                setResults((prev) => ({
                  ...prev,
                  mxAnalysis: {
                    loading: false,
                    error: "Failed to analyze MX records",
                  },
                }));
              }),

            // Email Security Check
            fetch("/api/email-security", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain }),
            })
              .then((res) => res.json())
              .then((data) => {
                setResults((prev) => ({
                  ...prev,
                  emailSecurity: { loading: false, data },
                }));
              })
              .catch(() => {
                setResults((prev) => ({
                  ...prev,
                  emailSecurity: {
                    loading: false,
                    error: "Failed to analyze email security",
                  },
                }));
              }),
          ]);
        }
      } catch (error) {
        console.error("Error:", error);
        setResults((prev) => ({
          ...prev,
          validation: { loading: false, error: "Failed to validate domain" },
        }));
      }
    } catch (error) {
      console.error("Error:", error);
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

        <ScoreBox
          title="Domain Validation"
          loading={results.validation?.loading}
          error={results.validation?.error}
          score={results.validation?.data?.score}
        >
          {results.validation?.data && (
            <ValidationBox data={results.validation.data} />
          )}
        </ScoreBox>

        <ScoreBox
          title="MX Records Analysis"
          loading={results.mxAnalysis?.loading}
          error={results.mxAnalysis?.error}
          score={results.mxAnalysis?.data?.score}
        >
          {results.mxAnalysis?.data && (
            <MxAnalysisBox data={results.mxAnalysis.data} />
          )}
        </ScoreBox>

        <ScoreBox
          title="Email Security Analysis"
          loading={results.emailSecurity?.loading}
          error={results.emailSecurity?.error}
          score={results.emailSecurity?.data?.totalScore}
        >
          {results.emailSecurity?.data && (
            <EmailSecurityBox data={results.emailSecurity.data} />
          )}
        </ScoreBox>

        <ScoreBox
          title="Domain Expiry Analysis"
          loading={results.expiryAnalysis?.loading}
          error={results.expiryAnalysis?.error}
          score={results.expiryAnalysis?.data?.expiryScore?.score}
        >
          {results.expiryAnalysis?.data && (
            <ExpiryAnalysisBox data={results.expiryAnalysis.data} />
          )}
        </ScoreBox>
      </div>
    </div>
  );
}
