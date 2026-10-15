"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import SpinWheel from "@/components/SpinWheel";
import QuestionCard from "@/components/QuestionCard";
import GradingForm from "@/components/GradingForm";

export default function StudentExamPage() {
  const [modul, setModul] = useState<number>(1);
  const [npm, setNpm] = useState<string>("");
  const [kelompok, setKelompok] = useState<string>("Kelompok 1");

  const [pickedNumber, setPickedNumber] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<any | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isReadyToSpin = npm.trim().length >= 3 && kelompok.trim().length > 0;

  const fetchCount = async () => {
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (data.success && data.stats) {
        setSavedCount(data.stats.totalStudents || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  const handleSpinComplete = (number: number, question: any) => {
    setPickedNumber(number);
    setQuestionData(question);

    setTimeout(() => {
      const qElem = document.getElementById("question-display-section");
      if (qElem) {
        qElem.scrollIntoView({ behavior: "smooth" });
      }
    }, 200);
  };

  const handleSavedAndNext = () => {
    const prevNpm = npm;
    setToastMsg(`Nilai ${prevNpm} berhasil disimpan.`);
    setTimeout(() => setToastMsg(null), 3000);

    setNpm("");
    setPickedNumber(null);
    setQuestionData(null);
    fetchCount();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      {/* Toast Notifikasi Sederhana */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md text-xs font-semibold">
          {toastMsg}
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Baris Status Singkat */}
        <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
          <span>Ujian Praktikum Sistem Mikroprosesor</span>
          <span className="font-semibold text-slate-700">
            Selesai: {savedCount} / 500 Mahasiswa
          </span>
        </div>

        {/* Form Identitas & Spin Wheel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Input Mahasiswa */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Identitas Mahasiswa
            </h2>

            {/* Pilihan Modul 1-5 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Modul
              </label>
              <select
                value={modul}
                disabled={pickedNumber !== null}
                onChange={(e) => setModul(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={1}>Modul 1: GPIO & Register</option>
                <option value={2}>Modul 2: Timer & Counter</option>
                <option value={3}>Modul 3: Interupsi & ADC</option>
                <option value={4}>Modul 4: Komunikasi Serial</option>
                <option value={5}>Modul 5: PWM & Kontrol Motor</option>
              </select>
            </div>

            {/* Input NPM */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NPM Mahasiswa
              </label>
              <input
                type="text"
                placeholder="Masukkan NPM..."
                value={npm}
                disabled={pickedNumber !== null}
                onChange={(e) => setNpm(e.target.value.toUpperCase())}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Selector Kelompok */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelompok
              </label>
              <select
                value={kelompok}
                disabled={pickedNumber !== null}
                onChange={(e) => setKelompok(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Array.from({ length: 50 }, (_, i) => `Kelompok ${i + 1}`).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kolom Kanan: Roda Putar */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col items-center justify-center">
            <SpinWheel
              modul={modul}
              npm={npm}
              kelompok={kelompok}
              disabled={!isReadyToSpin}
              onSpinComplete={handleSpinComplete}
            />
          </div>
        </div>

        {/* Hasil Undian Soal & Lembar Penilaian */}
        {pickedNumber !== null && questionData && (
          <div id="question-display-section" className="space-y-4 pt-2">
            <QuestionCard
              modul={modul}
              number={pickedNumber}
              title={questionData.title}
              fontFamily={questionData.fontFamily}
              htmlContent={questionData.htmlContent}
            />

            <GradingForm
              modul={modul}
              npm={npm}
              kelompok={kelompok}
              questionNumber={pickedNumber}
              questionContent={questionData.htmlContent}
              onSavedAndNext={handleSavedAndNext}
            />
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Laboratorium Sistem Mikroprosesor
      </footer>
    </div>
  );
}
