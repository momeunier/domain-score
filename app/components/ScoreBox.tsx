"use client";

import { useState } from "react";

interface ScoreBoxProps {
  title: string;
  score: number;
  children: React.ReactNode;
}

export default function ScoreBox({ title, score, children }: ScoreBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-4 p-4 border rounded-lg bg-slate-50 shadow-sm">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg text-slate-800">{title}</h2>
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
        </div>
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
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200">{children}</div>
      )}
    </div>
  );
}
