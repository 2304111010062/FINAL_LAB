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
} from "lucide-react";

interface RichTextEditorProps {
  initialContent: string;
  initialFontFamily?: "Arial" | "Courier New" | string;
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
  const [fontFamily, setFontFamily] = useState<string>(initialFontFamily || "Arial");
  const isUpdatingFromProps = useRef(false);

  useEffect(() => {
    if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
      isUpdatingFromProps.current = true;
      editorRef.current.innerHTML = initialContent || "";
      isUpdatingFromProps.current = false;
    }
  }, [initialContent]);

  useEffect(() => {
    if (initialFontFamily) setFontFamily(initialFontFamily);
  }, [initialFontFamily]);

  const handleInput = useCallback(() => {
    if (isUpdatingFromProps.current || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html, fontFamily);
  }, [fontFamily, onChange]);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleFontChange = (newFont: string) => {
    setFontFamily(newFont);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML, newFont);
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
        {/* Font Selection (Arial & Courier New) */}
        <div className="flex items-center gap-1 mr-2">
          <span className="text-slate-500 font-medium text-[11px]">Font:</span>
          <select
            value={fontFamily}
            onChange={(e) => handleFontChange(e.target.value)}
            className="bg-white text-slate-800 text-xs font-medium rounded border border-slate-300 px-2 py-1 outline-none"
          >
            <option value="Arial">Arial</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Formatting */}
        <button
          type="button"
          title="Tebal"
          onClick={() => executeCommand("bold")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Miring"
          onClick={() => executeCommand("italic")}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Garis Bawah"
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

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          fontFamily:
            fontFamily === "Courier New"
              ? "'Courier New', Courier, monospace"
              : "Arial, sans-serif",
        }}
        className="min-h-[220px] max-h-[380px] p-4 overflow-y-auto text-slate-900 bg-white focus:outline-none rich-text-content leading-relaxed text-sm"
        data-placeholder={placeholder}
      />
    </div>
  );
}
