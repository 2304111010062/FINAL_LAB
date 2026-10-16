"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import AdminBankSoal from "@/components/AdminBankSoal";
import AdminRekapNilai from "@/components/AdminRekapNilai";
import { LogOut, Lock } from "lucide-react";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [assignedModul, setAssignedModul] = useState<number | "all">("all");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"soal" | "rekap">("rekap");

  useEffect(() => {
    const token = sessionStorage.getItem("admin_auth_token");
    const savedModul = sessionStorage.getItem("admin_modul");
    if (token) {
      setIsAuthenticated(true);
      if (savedModul) {
        setAssignedModul(savedModul === "all" ? "all" : parseInt(savedModul, 10));
      }
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
      setAssignedModul(data.modul || "all");
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-5">
        {!isAuthenticated ? (
          /* Login Form */
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5" />
              </div>

              <div className="text-center mb-4">
                <h1 className="text-base font-bold text-slate-900">Login Admin Lab Sismik</h1>
                <p className="text-xs text-slate-500 mt-0.5">Silakan masukkan username dan password</p>
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
                    placeholder="LahSismikTE24"
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
                  {isVerifying ? "Memverifikasi..." : "Masuk"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Dashboard Admin Terverifikasi */
          <div className="space-y-4">
            {/* Top Tab Bar Sederhana */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("rekap")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "rekap"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Rekap Nilai
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("soal")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "soal"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Bank Soal
                </button>
              </div>

              <div className="flex items-center gap-3">
                {assignedModul !== "all" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Akses: Modul {assignedModul}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition"
                  title="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>

            {/* Konten Tab */}
            {activeTab === "rekap" ? (
              <AdminRekapNilai initialModul={assignedModul} />
            ) : (
              <AdminBankSoal initialModul={assignedModul === "all" ? 1 : assignedModul} />
            )}
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Panel Admin Lab Sismik
      </footer>
    </div>
  );
}
