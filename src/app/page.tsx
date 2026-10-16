"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import SpinWheel from "@/components/SpinWheel";
import QuestionCard from "@/components/QuestionCard";
import GradingForm from "@/components/GradingForm";
import { Lock, LogOut } from "lucide-react";

interface ModuleItem {
  modul: number;
  title: string;
}

export default function StudentExamPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [modul, setModul] = useState<number>(1);
  const [npm, setNpm] = useState<string>("");
  const [kelompok, setKelompok] = useState<string>("Kelompok 1");

  const [pickedNumber, setPickedNumber] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<any | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isReadyToSpin = npm.trim().length >= 3 && kelompok.trim().length > 0;

  useEffect(() => {
    const token = sessionStorage.getItem("admin_auth_token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsVerifying(true);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Username atau password salah");
      }

      sessionStorage.setItem("admin_auth_token", data.token);
      sessionStorage.setItem("admin_modul", data.modul?.toString() || "all");
      setIsAuthenticated(true);
      setPassword("");
    } catch (err: any) {
      setLoginError(err.message || "Gagal masuk");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth_token");
    sessionStorage.removeItem("admin_modul");
    setIsAuthenticated(false);
  };

  const fetchModules = async () => {
    try {
      const res = await fetch("/api/modules");
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setModules(data.data);
        setModul(data.data[0].modul);
      }
    } catch {
      // ignore
    }
  };

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
    fetchModules();
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
        {!isAuthenticated ? (
          /* Login Form Proteksi Halaman Ujian */
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5" />
              </div>

              <div className="text-center mb-4">
                <h1 className="text-base font-bold text-slate-900">Login Ujian Lab Sismik</h1>
                <p className="text-xs text-slate-500 mt-0.5">Silakan login untuk memulai sesi ujian</p>
              </div>

              {loginError && (
                <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    placeholder="labsismik"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || password.trim() === ""}
                  className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {isVerifying ? "Memverifikasi..." : "Masuk ke Ujian"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Konten Ujian Jika Terautentikasi */
          <>
            {/* Baris Status Singkat & Tombol Keluar */}
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span>Ujian Praktikum Sistem Mikroprosesor</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Aktif
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-700">
                  Selesai: {savedCount} Mahasiswa
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-medium py-1 px-2 rounded hover:bg-red-50 transition"
                  title="Keluar Sesi"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </div>
            </div>

            {/* Form Identitas & Spin Wheel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Input Mahasiswa */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Identitas Mahasiswa
            </h2>

            {/* Pilihan Modul Dinamis dari Database */}
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
                {modules.length > 0 ? (
                  modules.map((m) => (
                    <option key={m.modul} value={m.modul}>
                      Modul {m.modul}: {m.title}
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>Modul 1: I/O DEVICE</option>
                    <option value={2}>Modul 2: 7 SEGMENT</option>
                    <option value={3}>Modul 3: ADDRESSING MODE</option>
                    <option value={4}>Modul 4: JAM</option>
                    <option value={5}>Modul 5</option>
                  </>
                )}
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
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Laboratorium Sistem Mikroprosesor
      </footer>
    </div>
  );
}
