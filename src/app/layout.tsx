import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FINAL LAB SISMIK - Ujian Praktikum Sistem Mikroprosesor",
  description:
    "Aplikasi Ujian Praktikum Cepat: Spin Wheel Random Pick Soal 1-25, Rich Text Editor, dan Sistem Rekap Nilai Abadi dengan MongoDB Atlas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
