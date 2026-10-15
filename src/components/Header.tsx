"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>("");
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        }) + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-base text-slate-900 tracking-tight">
            LAB SISMIK
          </span>
        </Link>

        {/* Right Nav */}
        <div className="flex items-center gap-4">
          {currentTime && (
            <span className="hidden sm:inline text-xs font-mono text-slate-500">
              {currentTime}
            </span>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md transition ${
                !isAdmin
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Ujian
            </Link>
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-md transition ${
                isAdmin
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Admin / Rekap
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
