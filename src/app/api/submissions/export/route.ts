import { NextResponse } from "next/server";
import { connectToDatabase, localStore } from "@/lib/db";
import Submission from "@/models/Submission";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const modul = searchParams.get("modul");

    const db = await connectToDatabase();
    let submissions: any[] = [];

    const query: any = {};
    if (modul && modul !== "all") {
      query.modul = parseInt(modul, 10);
    }

    if (db) {
      submissions = await Submission.find(query).sort({ modul: 1, kelompok: 1, npm: 1 }).lean();
    } else {
      submissions = [...localStore.submissions];
      if (modul && modul !== "all") {
        const m = parseInt(modul, 10);
        submissions = submissions.filter((s) => s.modul === m);
      }
      submissions.sort((a, b) => a.modul - b.modul || a.npm.localeCompare(b.npm));
    }

    const headers = [
      "No",
      "Modul",
      "NPM",
      "Kelompok",
      "Nomor Soal",
      "Nilai",
      "Catatan",
      "Penilai",
      "Waktu Ujian (Lengkap: Hari, Tanggal, Jam WIB)",
    ];

    const rows = submissions.map((sub, idx) => {
      const dateStr = sub.createdAt
        ? new Date(sub.createdAt).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) + " WIB"
        : "-";

      return [
        idx + 1,
        `"Modul ${sub.modul || 1}"`,
        `"${sub.npm}"`,
        `"${sub.kelompok}"`,
        sub.questionNumber,
        sub.score,
        `"${(sub.notes || "").replace(/"/g, '""')}"`,
        `"${(sub.evaluator || "").replace(/"/g, '""')}"`,
        `"${dateStr}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const filename = `REKAP_NILAI_SISMIK_${modul ? "MODUL_" + modul + "_" : ""}${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Gagal ekspor CSV" }, { status: 500 });
  }
}
