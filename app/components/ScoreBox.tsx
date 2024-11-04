"use client";

import { useState } from "react";

interface ScoreBoxProps {
  title: string;
  score?: number;
  loading?: boolean;
  error?: string;
  children: React.ReactNode;
}

export default function ScoreBox({
  title,
  score,
  loading = false,
  error,
  children,
}: ScoreBoxProps) {
  const [isExpanded, setIsExpanded] = useState(loading);

  return (
    <div className="mt-4 p-4 border rounded-lg bg-slate-50 shadow-sm">
      <div
        className={`flex items-center justify-between ${
          !loading && !error && "cursor-pointer"
        }`}
        onClick={() => !loading && !error && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg text-slate-800">{title}</h2>
          {loading ? (
            <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium animate-pulse">
              Analyzing...
            </div>
          ) : error ? (
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-medium">
              Error
            </div>
          ) : (
            score !== undefined && (
              <div
                className={`px-3 py-1 rounded-full font-medium ${
                  score >= 80
                    ? "bg-green-100 text-green-800"
                    : score >= 60
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                Score: {score}/100
              </div>
            )
          )}
        </div>
        {!loading && !error && (
          <button className="text-slate-600 hover:text-slate-800">
            {isExpanded ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
