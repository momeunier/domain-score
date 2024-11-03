"use client";
import { useState } from "react";

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

interface AiResult {
  analysis: string;
}

interface Results {
  validation?: ValidationResult;
  whois?: WhoisResult;
  aiAnalysis?: AiResult;
  expiryScore?: {
    score: number;
    message: string;
    daysUntilExpiry: number | null;
  };
}

export default function Home() {
  const [domain, setDomain] = useState("");
  const [results, setResults] = useState<Results>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // WHOIS Lookup
        const whoisRes = await fetch("/api/whois", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });
        const whoisData = await whoisRes.json();
        setResults((prev) => ({ ...prev, whois: whoisData }));

        // AI Analysis
        if (whoisData.whoisData) {
          const aiRes = await fetch("/api/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ whoisData: whoisData.whoisData }),
          });
          const aiData = await aiRes.json();
          setResults((prev) => ({ ...prev, aiAnalysis: aiData }));

          // Pass the AI response directly to expiry-score
          const expiryScoreRes = await fetch("/api/expiry-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(aiData), // aiData already has the format { expiry: "YYYY-MM-DD" }
          });
          const expiryScoreData = await expiryScoreRes.json();
          setResults((prev) => ({ ...prev, expiryScore: expiryScoreData }));
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Domain Score Calculator
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter domain name"
            className="w-full p-3 rounded bg-white text-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-500 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            Calculate Score
          </button>
        </form>

        <div className="w-full max-w-md space-y-6">
          {results.validation && (
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Domain Validation</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Domain:</span>
                  <span className="text-blue-500">
                    {results.validation.domain}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <span className="flex items-center">
                    {results.validation.isValid ? (
                      <span className="text-green-500 flex items-center gap-1">
                        Valid <span className="text-xl">✅</span>
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1">
                        Invalid <span className="text-xl">❌</span>
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Score:</span>
                  <span
                    className={`font-semibold ${
                      results.validation.score === 100
                        ? "text-green-500"
                        : results.validation.score > 50
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {results.validation.score}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Message:</span>
                  <span className="text-gray-400">
                    {results.validation.message}
                  </span>
                </div>
              </div>
            </div>
          )}

          {results.whois && (
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">WHOIS Data</h2>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                {results.whois.whoisData ? (
                  <span className="text-green-500 flex items-center gap-1">
                    Data received <span className="text-xl">✅</span>
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-1">
                    No data available <span className="text-xl">❌</span>
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Data ready for AI analysis
              </div>
            </div>
          )}

          {results.aiAnalysis && (
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">AI Analysis</h2>
              <div className="text-gray-300 whitespace-pre-wrap">
                {results.aiAnalysis.analysis}
              </div>
            </div>
          )}

          {results.expiryScore && (
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Expiry Score</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Score:</span>
                  <span
                    className={`font-semibold ${
                      results.expiryScore.score === 100
                        ? "text-green-500"
                        : results.expiryScore.score > 50
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {results.expiryScore.score}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Message:</span>
                  <span className="text-gray-400">
                    {results.expiryScore.message}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Days Until Expiry:</span>
                  <span className="text-gray-400">
                    {results.expiryScore.daysUntilExpiry}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
