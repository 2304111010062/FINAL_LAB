"use client";

import React, { useState } from "react";
import { soundEffects } from "@/lib/sound";

interface GradingFormProps {
  modul: number;
  npm: string;
  kelompok: string;
  questionNumber: number;
  questionContent?: string;
  onSavedAndNext: () => void;
}

const EVALUATOR_CODES = ["NS", "AM", "IP", "RS", "DM", "MM", "FT"];

export default function GradingForm({
  modul,
  npm,
  kelompok,
  questionNumber,
  questionContent,
  onSavedAndNext,
}: GradingFormProps) {
  const [score, setScore] = useState<string>("");
  const [evaluator, setEvaluator] = useState<string>("NS");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericScore = parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      setErrorMsg("Masukkan nilai antara 0 sampai 100.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modul,
          npm,
          kelompok,
          questionNumber,
          questionSnapshot: questionContent || "",
          score: numericScore,
          notes: "",
          evaluator,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan nilai");
      }

      soundEffects.playSuccess();
      onSavedAndNext();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan nilai ke database");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Penilaian</h3>
          <p className="text-xs text-slate-500">
            {npm} • {kelompok} • Modul {modul}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
          Soal #{questionNumber}
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-600 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Input Skor */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nilai (0 - 100) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            required
            placeholder="Masukkan nilai..."
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-base font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Dropdown Kode Penilai: NS, AM, IP, RS, DM, MM */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Kode Penilai <span className="text-red-500">*</span>
          </label>
          <select
            value={evaluator}
            onChange={(e) => setEvaluator(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {EVALUATOR_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || score === ""}
          className={`px-5 py-2.5 rounded-lg font-semibold text-xs transition ${
            isSubmitting || score === ""
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          }`}
        >
          {isSubmitting ? "Menyimpan..." : "Simpan & Lanjut"}
        </button>
      </div>
    </form>
  );
}
