"use client";

import React, { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import { Edit2, Trash2, X, RefreshCw, UploadCloud, Settings, Edit3 } from "lucide-react";

interface QuestionItem {
  _id?: string;
  modul: number;
  number: number;
  title: string;
  fontFamily: "Arial" | "Courier New" | string;
  htmlContent: string;
}

interface AdminBankSoalProps {
  initialModul?: number | "all";
}

export default function AdminBankSoal({ initialModul = 1 }: AdminBankSoalProps) {
  const [selectedModul, setSelectedModul] = useState<number>(
    typeof initialModul === "number" ? initialModul : 1
  );
  const [moduleTitles, setModuleTitles] = useState<Record<number, string>>({
    1: "GPIO & Register",
    2: "Timer & Counter",
    3: "Interupsi & ADC",
    4: "Komunikasi Serial",
    5: "PWM & Kontrol Motor",
  });
  const [isEditingModules, setIsEditingModules] = useState(false);
  const [tempTitles, setTempTitles] = useState<Record<number, string>>({});
  const [isSavingTitles, setIsSavingTitles] = useState(false);

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Form states in modal
  const [editFontFamily, setEditFontFamily] = useState<"Arial" | "Courier New">("Arial");
  const [editHtml, setEditHtml] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const fetchModuleTitles = async () => {
    try {
      const res = await fetch("/api/modules");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
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

  const fetchQuestions = async (modulNum = selectedModul) => {
    setLoading(true);
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
    fetchModuleTitles();
  }, []);

  useEffect(() => {
    fetchQuestions(selectedModul);
  }, [selectedModul]);

  const openEditModal = (q: QuestionItem) => {
    setSelectedQuestion(q);
    setEditTitle(q.title || `Soal #${q.number}`);
    setEditFontFamily((q.fontFamily as "Arial" | "Courier New") || "Arial");
    setEditHtml(q.htmlContent || "");
    setShowSettings(false);
    setIsEditing(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuestion) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/questions/${selectedQuestion.number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modul: selectedModul,
          title: editTitle || `Soal #${selectedQuestion.number}`,
          fontFamily: editFontFamily,
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

  const handleDeleteCard = async (qNum: number) => {
    if (!confirm(`Hapus/kosongkan isi Soal #${qNum} Modul ${selectedModul}?`)) return;

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

  const handlePushModul = async () => {
    if (!confirm(`Push/reset 25 bank soal standar untuk Modul ${selectedModul}?`)) return;
    setIsPushing(true);

    try {
      const res = await fetch("/api/questions/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modul: selectedModul }),
      });
      const data = await res.json();
      if (data.success) {
        fetchQuestions(selectedModul);
      }
    } catch (err) {
      console.error("Gagal push soal:", err);
    } finally {
      setIsPushing(false);
    }
  };

  const openModuleTitlesModal = () => {
    setTempTitles({ ...moduleTitles });
    setIsEditingModules(true);
  };

  const handleSaveModuleTitles = async () => {
    setIsSavingTitles(true);
    try {
      const payload = [1, 2, 3, 4, 5].map((m) => ({
        modul: m,
        title: tempTitles[m] || `Modul ${m}`,
      }));

      const res = await fetch("/api/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: payload }),
      });

      const data = await res.json();
      if (data.success) {
        setModuleTitles({ ...tempTitles });
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
        {/* Modul 1 to 5 Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedModul(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedModul === m
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Modul {m}: {moduleTitles[m] || `Modul ${m}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* Tombol Edit Semua Judul Modul */}
          <button
            type="button"
            onClick={openModuleTitlesModal}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Judul Modul</span>
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

          <button
            type="button"
            onClick={handlePushModul}
            disabled={isPushing}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isPushing ? "Memuat..." : `Push Soal Modul ${selectedModul}`}</span>
          </button>
        </div>
      </div>

      {/* Grid 25 Soal */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          Memuat daftar soal Modul {selectedModul}...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
            const q = questions.find((item) => item.number === num);
            const hasContent = q && q.htmlContent && q.htmlContent.trim().length > 0;

            return (
              <div
                key={num}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-blue-400 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      #{num}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {q?.fontFamily || "Arial"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100 text-xs text-slate-600 line-clamp-3 min-h-[56px]">
                    {hasContent ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: q?.htmlContent.replace(/<[^>]+>/g, " ").slice(0, 130) + "...",
                        }}
                      />
                    ) : (
                      <span className="italic text-slate-400">Belum ada konten</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteCard(num)}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs font-medium flex items-center gap-1 transition"
                    title="Kosongkan Soal Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(
                        q || {
                          modul: selectedModul,
                          number: num,
                          title: `Soal #${num}`,
                          fontFamily: "Arial",
                          htmlContent: "",
                        }
                      )
                    }
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Edit Semua Judul Modul */}
      {isEditingModules && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Edit Semua Judul Modul (Modul 1 s.d. 5)
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingModules(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((m) => (
                <div key={m}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Modul {m}
                  </label>
                  <input
                    type="text"
                    value={tempTitles[m] || ""}
                    onChange={(e) =>
                      setTempTitles({ ...tempTitles, [m]: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={`Nama Modul ${m}...`}
                  />
                </div>
              ))}
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
                {isSavingTitles ? "Menyimpan..." : "Simpan Semua Judul Modul"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Soal */}
      {isEditing && selectedQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl flex flex-col shadow-xl overflow-hidden max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  #{selectedQuestion.number}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Edit Soal #{selectedQuestion.number} • Modul {selectedModul}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded transition text-xs font-medium flex items-center gap-1 ${
                    showSettings ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"
                  }`}
                  title="Pengaturan Tambahan"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Seting</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showSettings && (
              <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Font Utama</label>
                  <select
                    value={editFontFamily}
                    onChange={(e) => setEditFontFamily(e.target.value as "Arial" | "Courier New")}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Judul Singkat</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                    placeholder={`Soal #${selectedQuestion.number}`}
                  />
                </div>
              </div>
            )}

            <div className="p-4 overflow-y-auto">
              <RichTextEditor
                initialContent={editHtml}
                initialFontFamily={editFontFamily}
                onChange={(html, font) => {
                  setEditHtml(html);
                  setEditFontFamily(font as "Arial" | "Courier New");
                }}
                placeholder="Ketik soal praktikum di sini..."
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
                {isSaving ? "Menyimpan..." : "Simpan Soal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
