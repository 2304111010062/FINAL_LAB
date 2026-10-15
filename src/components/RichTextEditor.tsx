"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Type,
} from "lucide-react";

interface RichTextEditorProps {
  initialContent: string;
  initialFontFamily?: string;
  onChange: (htmlContent: string, fontFamily: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  initialContent,
  initialFontFamily = "Arial",
  onChange,
  placeholder = "Tuliskan soal di sini...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [selectedFont, setSelectedFont] = useState<string>("Arial");
  const isUpdatingFromProps = useRef(false);

  useEffect(() => {
    if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
      isUpdatingFromProps.current = true;
      editorRef.current.innerHTML = initialContent || "";
      isUpdatingFromProps.current = false;
    }
  }, [initialContent]);

  const handleInput = useCallback(() => {
    if (isUpdatingFromProps.current || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html, "Arial");
  }, [onChange]);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Terapkan font ke teks yang sedang diblok (selection)
  const applyFontToSelection = (fontName: string) => {
    setSelectedFont(fontName);
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      // Jika tidak ada teks yang diblok, ubah font default atau beri tahu user
      document.execCommand("fontName", false, fontName);
      if (editorRef.current) {
        editorRef.current.focus();
        handleInput();
      }
      return;
    }

    // Ada teks yang diblok: eksekusi fontName pada seleksi teks tersebut
    document.execCommand("fontName", false, fontName);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      document.execCommand("defaultParagraphSeparator", false, "p");
    }
  };

  return (
    <div className="border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
      {/* Simple Toolbar */}
      <div className="p-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
        {/* Tombol Font Khusus Seleksi / Blok */}
        <div className="flex items-center gap-1 mr-1">
          <Type className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 font-medium text-[11px]">Font Seleksi:</span>
          <button
            type="button"
            title="Terapkan font Arial ke teks yang diblok"
            onClick={() => applyFontToSelection("Arial")}
            className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-slate-700 font-sans font-medium transition text-[11px]"
          >
            Arial
          </button>
          <button
            type="button"
            title="Terapkan font Courier New ke teks yang diblok"
            onClick={() => applyFontToSelection("Courier New")}
            className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-slate-700 font-mono font-medium transition text-[11px]"
          >
            Courier New
          </button>
        </div>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Formatting */}
        <button
          type="button"
          title="Tebal (Ctrl+B)"
          onClick={() => executeCommand("bold")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Miring (Ctrl+I)"
          onClick={() => executeCommand("italic")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Garis Bawah (Ctrl+U)"
          onClick={() => executeCommand("underline")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          title="Rata Kiri"
          onClick={() => executeCommand("justifyLeft")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Rata Tengah"
          onClick={() => executeCommand("justifyCenter")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Rata Kanan"
          onClick={() => executeCommand("justifyRight")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Rata Kanan-Kiri"
          onClick={() => executeCommand("justifyFull")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* List */}
        <button
          type="button"
          title="Bullet List"
          onClick={() => executeCommand("insertUnorderedList")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Numbered List"
          onClick={() => executeCommand("insertOrderedList")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-1 bg-blue-50/50 border-b border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>💡 Tips: Blok teks tertentu lalu klik <b>Arial</b> atau <b>Courier New</b> untuk mengombinasikan font.</span>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[220px] max-h-[380px] p-4 overflow-y-auto text-slate-900 bg-white focus:outline-none rich-text-content leading-relaxed text-sm"
        data-placeholder={placeholder}
      />
    </div>
  );
}
