"use client";

import React from "react";

interface QuestionCardProps {
  modul: number;
  number: number;
  title?: string;
  fontFamily?: string;
  htmlContent: string;
}

export default function QuestionCard({
  modul,
  number,
  title,
  fontFamily = "Arial",
  htmlContent,
}: QuestionCardProps) {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header Soal */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            {number}
          </span>
          <h2 className="text-sm font-bold text-slate-900">
            {title || `Soal Nomor ${number}`}
          </h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
          Modul {modul}
        </span>
      </div>

      {/* Render HTML Konten Soal */}
      <div className="p-6">
        <div
          style={{
            fontFamily:
              fontFamily === "Courier New"
                ? "'Courier New', Courier, monospace"
                : "Arial, sans-serif",
          }}
          className="rich-text-content text-slate-900 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}
