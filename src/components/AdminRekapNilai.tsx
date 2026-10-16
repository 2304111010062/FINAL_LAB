"use client";

import React, { useState, useEffect } from "react";
import { Download, Search, RefreshCw, Trash2, Eye, X, Edit, Check } from "lucide-react";

interface SubmissionItem {
  _id: string;
  modul: number;
  npm: string;
  kelompok: string;
  questionNumber: number;
  questionSnapshot?: string;
  score: number;
  notes?: string;
  evaluator?: string;
  createdAt: string;
}

interface ModuleItem {
  modul: number;
  title: string;
}

interface StatsData {
  totalStudents: number;
  targetCapacity: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
}

interface AdminRekapNilaiProps {
  initialModul?: number | "all";
}

export function formatFullDateTime(dateString: string | Date | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return (
    date.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " WIB"
  );
}

export default function AdminRekapNilai({ initialModul = "all" }: AdminRekapNilaiProps) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [moduleTitles, setModuleTitles] = useState<Record<number, string>>({});
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    targetCapacity: 500,
    avgScore: 0,
    maxScore: 0,
    minScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModul, setSelectedModul] = useState<string>(
    initialModul === "all" ? "all" : initialModul.toString()
  );
  const [selectedKelompok, setSelectedKelompok] = useState("all");
  const [inspectItem, setInspectItem] = useState<SubmissionItem | null>(null);

  // Edit Modal State
  const [editItem, setEditItem] = useState<SubmissionItem | null>(null);
  const [editForm, setEditForm] = useState({
    npm: "",
    kelompok: "",
    modul: 1,
    questionNumber: 1,
    score: 0,
    evaluator: "",
    notes: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchModules = async () => {
    try {
      const res = await fetch("/api/modules");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setModules(data.data);
        const map: Record<number, string> = {};
        data.data.forEach((m: any) => {
          map[m.modul] = m.title;
        });
        setModuleTitles(map);
      }
    } catch {
      // ignore
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedModul !== "all") params.append("modul", selectedModul);
      if (selectedKelompok !== "all") params.append("kelompok", selectedKelompok);
      if (searchTerm.trim() !== "") params.append("search", searchTerm.trim());

      const res = await fetch(`/api/submissions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Gagal memuat rekap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [selectedModul, selectedKelompok]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubmissions();
  };

  const handleExportCSV = () => {
    const url = `/api/submissions/export?modul=${selectedModul}`;
    window.open(url, "_blank");
  };

  const handleDeleteItem = async (id: string, npm: string) => {
    if (!confirm(`Hapus nilai mahasiswa NPM ${npm}?`)) return;
    try {
      const res = await fetch(`/api/submissions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchSubmissions();
    } catch (err) {
      console.error("Gagal menghapus:", err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Kosongkan SEMUA rekap nilai mahasiswa? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }
    try {
      const res = await fetch("/api/submissions?clearAll=true", { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchSubmissions();
    } catch (err) {
      console.error("Gagal menghapus semua:", err);
    }
  };

  const handleOpenEdit = (item: SubmissionItem) => {
    setEditError("");
    setEditItem(item);
    setEditForm({
      npm: item.npm,
      kelompok: item.kelompok,
      modul: item.modul || 1,
      questionNumber: item.questionNumber || 1,
      score: item.score || 0,
      evaluator: item.evaluator || "",
      notes: item.notes || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setEditSaving(true);
    setEditError("");

    try {
      const res = await fetch("/api/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem._id,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memperbarui data mahasiswa");
      }

      setEditItem(null);
      fetchSubmissions();
    } catch (err: any) {
      setEditError(err.message || "Terjadi kesalahan saat menyimpan perubahan");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 4 Kartu Metrik Ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Dinilai</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-slate-900">{stats.totalStudents}</span>
            <span className="text-xs text-slate-400">Mahasiswa</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Rata-Rata</span>
          <div className="mt-1">
            <span className="text-2xl font-bold text-blue-600">{stats.avgScore}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Tertinggi</span>
          <div className="mt-1">
            <span className="text-2xl font-bold text-emerald-600">{stats.maxScore}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Terendah</span>
          <div className="mt-1">
            <span className="text-2xl font-bold text-slate-700">{stats.minScore}</span>
          </div>
        </div>
      </div>

      {/* Filter & Aksi */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Filter Modul Dinamis dengan judul dari database */}
          <select
            value={selectedModul}
            onChange={(e) => setSelectedModul(e.target.value)}
            className="bg-white text-slate-800 text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 font-semibold focus:outline-none"
          >
            <option value="all">Semua Modul</option>
            {modules.map((m) => (
              <option key={m.modul} value={m.modul}>
                Modul {m.modul}: {m.title}
              </option>
            ))}
          </select>

          {/* Filter Kelompok (1 s.d. 50) */}
          <select
            value={selectedKelompok}
            onChange={(e) => setSelectedKelompok(e.target.value)}
            className="bg-white text-slate-800 text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none"
          >
            <option value="all">Semua Kelompok</option>
            {Array.from({ length: 50 }, (_, i) => `Kelompok ${i + 1}`).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          {/* Search NPM */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[160px]">
            <input
              type="text"
              placeholder="Cari NPM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSubmissions}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {submissions.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
              title="Reset Semua Rekap"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabel Rekap dengan WAKTU LENGKAP: HARI, TANGGAL, BULAN, TAHUN, JAM, MENIT, DETIK */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3">Modul</th>
                <th className="py-2.5 px-3">NPM</th>
                <th className="py-2.5 px-3">Kelompok</th>
                <th className="py-2.5 px-3 text-center">Soal</th>
                <th className="py-2.5 px-3 text-center">Nilai</th>
                <th className="py-2.5 px-3">Penilai</th>
                <th className="py-2.5 px-3 min-w-[210px]">Waktu Ujian (Hari, Tgl, Jam)</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                    Memuat data rekap...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                    Belum ada nilai yang tercatat untuk filter ini.
                  </td>
                </tr>
              ) : (
                submissions.map((sub, idx) => {
                  const fullDateStr = formatFullDateTime(sub.createdAt);

                  return (
                    <tr key={sub._id || idx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-blue-700">
                        Modul {sub.modul || 1}
                        {moduleTitles[sub.modul] && (
                          <span className="block text-[10px] font-normal text-slate-500">
                            {moduleTitles[sub.modul]}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{sub.npm}</td>
                      <td className="py-2.5 px-3">{sub.kelompok}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        #{sub.questionNumber}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                            sub.score >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : sub.score >= 70
                              ? "bg-blue-50 text-blue-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {sub.score}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{sub.evaluator || "-"}</td>
                      {/* Waktu lengkap: Hari, Tanggal, Jam WIB */}
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {fullDateStr}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sub)}
                            className="p-1 rounded text-slate-400 hover:text-amber-600"
                            title="Edit Data Mahasiswa"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {sub.questionSnapshot && (
                            <button
                              type="button"
                              onClick={() => setInspectItem(sub)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600"
                              title="Lihat Soal"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(sub._id, sub.npm)}
                            className="p-1 rounded text-slate-400 hover:text-red-600"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg flex flex-col shadow-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Edit Data & Nilai Mahasiswa
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Waktu Ujian: {formatFullDateTime(editItem.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              {editError && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NPM Mahasiswa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.npm}
                    onChange={(e) => setEditForm({ ...editForm, npm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="240410501..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelompok <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.kelompok}
                    onChange={(e) => setEditForm({ ...editForm, kelompok: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Kelompok 25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Modul
                  </label>
                  <select
                    value={editForm.modul}
                    onChange={(e) => setEditForm({ ...editForm, modul: parseInt(e.target.value, 10) })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {modules.length > 0 ? (
                      modules.map((m) => (
                        <option key={m.modul} value={m.modul}>
                          Modul {m.modul}
                        </option>
                      ))
                    ) : (
                      [1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          Modul {num}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Soal
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.questionNumber}
                    onChange={(e) => setEditForm({ ...editForm, questionNumber: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nilai (0 - 100) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editForm.score}
                    onChange={(e) => setEditForm({ ...editForm, score: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Penilai / Inisial Asisten
                  </label>
                  <input
                    type="text"
                    value={editForm.evaluator}
                    onChange={(e) => setEditForm({ ...editForm, evaluator: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="NS, AM, MM..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Catatan tambahan..."
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Soal #{inspectItem.questionNumber} • {inspectItem.npm} (Modul {inspectItem.modul})
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Waktu Ujian: {formatFullDateTime(inspectItem.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              <div
                className="rich-text-content text-slate-800 p-3 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: inspectItem.questionSnapshot || "<p>Tidak ada snapshot.</p>",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
