"use client";

import React, { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import {
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Plus,
  PlusCircle,
  CheckSquare,
  Square,
} from "lucide-react";

interface QuestionItem {
  _id?: string;
  modul: number;
  number: number;
  title: string;
  fontFamily: string;
  htmlContent: string;
}

interface ModuleItem {
  modul: number;
  title: string;
}

interface AdminBankSoalProps {
  initialModul?: number | "all";
}

export default function AdminBankSoal({ initialModul = 1 }: AdminBankSoalProps) {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [selectedModul, setSelectedModul] = useState<number>(
    typeof initialModul === "number" ? initialModul : 1
  );

  // Modal edit / tambah modul
  const [isEditingModules, setIsEditingModules] = useState(false);
  const [tempModules, setTempModules] = useState<ModuleItem[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isSavingTitles, setIsSavingTitles] = useState(false);

  // Soal state
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-select & Bulk Delete state
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form states in modal
  const [editHtml, setEditHtml] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editNumber, setEditNumber] = useState<number>(1);
  const [isNewQuestion, setIsNewQuestion] = useState(false);

  const fetchModules = async () => {
    try {
      const res = await fetch("/api/modules");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setModules(data.data);
        if (data.data.length > 0 && !data.data.some((m: any) => m.modul === selectedModul)) {
          setSelectedModul(data.data[0].modul);
        }
      }
    } catch (err) {
      console.error("Gagal memuat modul:", err);
    }
  };

  const fetchQuestions = async (modulNum = selectedModul) => {
    setLoading(true);
    setSelectedNumbers([]);
    try {
      const res = await fetch(`/api/questions?modul=${modulNum}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data);
      }
    } catch (err) {
      console.error("Gagal memuat soal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModul) {
      fetchQuestions(selectedModul);
    }
  }, [selectedModul]);

  // Select all toggle
  const isAllSelected =
    questions.length > 0 && selectedNumbers.length === questions.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNumbers([]);
    } else {
      setSelectedNumbers(questions.map((q) => q.number));
    }
  };

  const handleToggleSelectItem = (number: number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== number));
    } else {
      setSelectedNumbers([...selectedNumbers, number]);
    }
  };

  // Bulk Delete terpilih
  const handleDeleteSelected = async () => {
    if (selectedNumbers.length === 0) return;
    if (
      !confirm(
        `Yakin ingin menghapus ${selectedNumbers.length} soal terpilih dari Modul ${selectedModul}?`
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const res = await fetch(`/api/questions?modul=${selectedModul}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: selectedNumbers }),
      });
      const data = await res.json();
      if (data.success) {
        fetchQuestions(selectedModul);
      } else {
        alert(data.error || "Gagal menghapus soal");
      }
    } catch (err) {
      console.error("Gagal bulk delete:", err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Hapus semua soal di modul
  const handleClearAllQuestions = async () => {
    if (
      !confirm(
        `PERINGATAN: Kosongkan SEMUA soal di Modul ${selectedModul}? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const res = await fetch(`/api/questions?modul=${selectedModul}&clearAll=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchQuestions(selectedModul);
      }
    } catch (err) {
      console.error("Gagal clear all:", err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const openCreateQuestionModal = () => {
    const nextNum = questions.length > 0 ? Math.max(...questions.map((q) => q.number)) + 1 : 1;
    setSelectedQuestion({
      modul: selectedModul,
      number: nextNum,
      title: `Soal #${nextNum}`,
      fontFamily: "Arial",
      htmlContent: "",
    });
    setEditNumber(nextNum);
    setEditTitle(`Soal #${nextNum}`);
    setEditHtml("");
    setIsNewQuestion(true);
    setIsEditing(true);
  };

  const openEditModal = (q: QuestionItem) => {
    setSelectedQuestion(q);
    setEditNumber(q.number);
    setEditTitle(q.title || `Soal #${q.number}`);
    setEditHtml(q.htmlContent || "");
    setIsNewQuestion(false);
    setIsEditing(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuestion) return;
    setIsSaving(true);

    try {
      const url = isNewQuestion
        ? "/api/questions"
        : `/api/questions/${editNumber}`;
      const method = isNewQuestion ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modul: selectedModul,
          number: editNumber,
          title: `Soal #${editNumber}`,
          fontFamily: "Arial",
          htmlContent: editHtml,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan");
      }

      setIsEditing(false);
      fetchQuestions(selectedModul);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan soal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (qNum: number) => {
    if (!confirm(`Hapus permanen Soal #${qNum} dari Modul ${selectedModul}?`)) return;

    try {
      const res = await fetch(`/api/questions/${qNum}?modul=${selectedModul}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchQuestions(selectedModul);
      }
    } catch (err) {
      console.error("Gagal menghapus:", err);
    }
  };

  const openModuleTitlesModal = () => {
    setTempModules([...modules]);
    setNewModuleTitle("");
    setIsEditingModules(true);
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newModuleTitle.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTempModules([...tempModules, data.data]);
        setNewModuleTitle("");
        fetchModules();
      }
    } catch (err) {
      console.error("Gagal menambah modul:", err);
    }
  };

  const handleDeleteModule = async (modulNum: number) => {
    if (!confirm(`Hapus Modul ${modulNum} beserta seluruh soal di dalamnya?`)) return;
    try {
      const res = await fetch(`/api/modules?modul=${modulNum}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setTempModules(tempModules.filter((m) => m.modul !== modulNum));
        fetchModules();
      }
    } catch (err) {
      console.error("Gagal menghapus modul:", err);
    }
  };

  const handleSaveModuleTitles = async () => {
    setIsSavingTitles(true);
    try {
      const res = await fetch("/api/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: tempModules }),
      });

      const data = await res.json();
      if (data.success) {
        setModules([...tempModules]);
        setIsEditingModules(false);
      } else {
        alert(data.error || "Gagal menyimpan");
      }
    } catch (err) {
      console.error("Save module titles failed:", err);
    } finally {
      setIsSavingTitles(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Modul Selector & Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
        {/* Modul Filter Pills Dinamis */}
        <div className="flex flex-wrap items-center gap-1.5">
          {modules.map((m) => (
            <button
              key={m.modul}
              type="button"
              onClick={() => setSelectedModul(m.modul)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedModul === m.modul
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Modul {m.modul}: {m.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
          {/* Tombol Kelola & Tambah Modul */}
          <button
            type="button"
            onClick={openModuleTitlesModal}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Kelola / Tambah Modul</span>
          </button>

          {/* Tombol Tambah Soal di Modul Ini */}
          <button
            type="button"
            onClick={openCreateQuestionModal}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tambah Soal</span>
          </button>

          <button
            type="button"
            onClick={() => fetchQuestions(selectedModul)}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Select All & Bulk Action Bar */}
      {questions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 transition"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {isAllSelected ? "Batal Pilih Semua" : "Pilih Semua (Select All)"}
              </span>
            </button>

            {selectedNumbers.length > 0 && (
              <span className="text-slate-500 font-mono">
                ({selectedNumbers.length} dari {questions.length} dipilih)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedNumbers.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={isBulkDeleting}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isBulkDeleting
                    ? "Menghapus..."
                    : `Hapus ${selectedNumbers.length} Soal Terpilih`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* List Card Soal - Vertikal ke Bawah Semua */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
          Memuat daftar soal Modul {selectedModul}...
        </div>
      ) : questions.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200 space-y-2">
          <p>Belum ada soal untuk Modul {selectedModul}.</p>
          <button
            type="button"
            onClick={openCreateQuestionModal}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Soal Pertama
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((q) => {
            const hasContent = q && q.htmlContent && q.htmlContent.trim().length > 0;
            const isSelected = selectedNumbers.includes(q.number);

            return (
              <div
                key={q.number}
                className={`w-full bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500"
                    : "border-slate-200 hover:border-blue-400"
                }`}
              >
                {/* Checkbox & Konten Soal */}
                <div className="flex items-start gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectItem(q.number)}
                    className="mt-1 text-slate-400 hover:text-blue-600 transition shrink-0"
                    title={isSelected ? "Batal pilih" : "Pilih soal ini"}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        #{q.number}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">
                        {q.title || `Soal #${q.number}`}
                      </h4>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-28 overflow-y-auto rich-text-content">
                      {hasContent ? (
                        <div dangerouslySetInnerHTML={{ __html: q.htmlContent }} />
                      ) : (
                        <span className="italic text-slate-400">Belum ada konten soal</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center justify-end gap-2 shrink-0 md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 pl-7 md:pl-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.number)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-medium flex items-center gap-1 transition"
                    title="Hapus Soal Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(q)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Soal</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Kelola & Tambah Modul */}
      {isEditingModules && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Kelola Modul Praktikum (CRUD Modul)
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingModules(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Form Tambah Modul Baru */}
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                <label className="block text-xs font-bold text-blue-900">
                  + Tambah Modul Baru
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="Contoh: Modul 6: INTERFACING SENSOR"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddModule}
                    disabled={!newModuleTitle.trim()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold transition"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {/* Daftar Modul yang Ada */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-600">Daftar Modul Saat Ini:</span>
                {tempModules.map((m, idx) => (
                  <div key={m.modul} className="flex items-center gap-2">
                    <span className="w-16 text-xs font-bold text-slate-700 shrink-0">
                      Modul {m.modul}
                    </span>
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) => {
                        const updated = [...tempModules];
                        updated[idx] = { ...m, title: e.target.value };
                        setTempModules(updated);
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {tempModules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteModule(m.modul)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 transition"
                        title={`Hapus Modul ${m.modul}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingModules(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveModuleTitles}
                disabled={isSavingTitles}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
              >
                {isSavingTitles ? "Menyimpan..." : "Simpan Perubahan Judul"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit / Tambah Soal */}
      {isEditing && selectedQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl flex flex-col shadow-xl overflow-hidden max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  #{editNumber}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isNewQuestion ? "Tambah Soal Baru" : `Edit Soal #${editNumber}`} • Modul {selectedModul}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Header Soal */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs">
              <div className="w-32">
                <label className="block font-semibold text-slate-700 mb-1">Nomor Soal</label>
                <input
                  type="number"
                  min="1"
                  value={editNumber}
                  onChange={(e) => setEditNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold"
                />
              </div>
            </div>

            {/* Editor dengan Per-Selection Font */}
            <div className="p-4 overflow-y-auto">
              <RichTextEditor
                initialContent={editHtml}
                onChange={(html) => {
                  setEditHtml(html);
                }}
                placeholder="Ketik isi soal praktikum di sini. Anda bisa memblok teks dan memilih font Arial / Courier New secara kombinasi..."
              />
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveQuestion}
                disabled={isSaving}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm"
              >
                {isSaving ? "Menyimpan..." : isNewQuestion ? "Tambah Soal" : "Simpan Soal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
