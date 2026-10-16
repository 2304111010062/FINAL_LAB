import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase, localStore } from "@/lib/db";
import Question from "@/models/Question";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { npm, kelompok } = body;
    const modul = parseInt(body.modul || "1", 10);
    const targetModul = isNaN(modul) || modul < 1 ? 1 : modul;

    const db = await connectToDatabase();

    // Dapatkan semua soal yang tersedia di modul ini
    let availableQuestions: any[] = [];
    let recentPickedNumbers: number[] = [];

    if (db) {
      availableQuestions = await Question.find({ modul: targetModul }).sort({ number: 1 }).lean();

      // Cek riwayat soal yang baru saja di-spin di modul ini (10-15 mahasiswa terakhir)
      try {
        const SubmissionModel = (await import("@/models/Submission")).default;
        const recentSubmissions = await SubmissionModel.find({ modul: targetModul })
          .sort({ createdAt: -1 })
          .limit(15)
          .select("questionNumber")
          .lean();
        recentPickedNumbers = recentSubmissions.map((s: any) => s.questionNumber);
      } catch {
        // Abaikan jika query riwayat gagal
      }
    } else {
      Array.from(localStore.questions.entries()).forEach(([key, val]) => {
        if (key.startsWith(`${targetModul}_`)) {
          availableQuestions.push(val);
        }
      });
      recentPickedNumbers = localStore.submissions
        .filter((s: any) => s.modul === targetModul)
        .slice(0, 15)
        .map((s: any) => s.questionNumber);
    }

    if (!availableQuestions || availableQuestions.length === 0) {
      // Buat default soal jika benar-benar kosong
      availableQuestions = [
        {
          modul: targetModul,
          number: 1,
          title: `Soal #1 Modul ${targetModul}`,
          htmlContent: `<p>Soal nomor 1 Modul ${targetModul} belum memiliki konten.</p>`,
          fontFamily: "Arial",
        },
      ];
    }

    // --- ALGORITMA FAIR RANDOM (ANTI DUPLIKAT BERULANG) ---
    // 1. Hitung frekuensi kemunculan soal di riwayat terakhir
    const recencyCountMap = new Map<number, number>();
    recentPickedNumbers.forEach((num, idx) => {
      // Soal yang baru saja muncul 3-5 giliran terakhir diberi bobot penalti lebih besar
      const weight = idx < 5 ? 3 : 1;
      recencyCountMap.set(num, (recencyCountMap.get(num) || 0) + weight);
    });

    // 2. Pisahkan kandidat soal yang belum pernah / paling jarang keluar baru-baru ini
    // Cari soal dengan penalti kemunculan terendah
    let minPenalty = Infinity;
    availableQuestions.forEach((q) => {
      const penalty = recencyCountMap.get(q.number) || 0;
      if (penalty < minPenalty) {
        minPenalty = penalty;
      }
    });

    // 3. Kumpulkan kelompok kandidat terbaik (yang paling jarang keluar)
    let candidatePool = availableQuestions.filter(
      (q) => (recencyCountMap.get(q.number) || 0) <= minPenalty
    );

    // Jika kandidat terlalu sedikit (< 3), perluas kumpulan kandidat agar tetap variatif
    if (candidatePool.length < 3 && availableQuestions.length >= 3) {
      candidatePool = availableQuestions.filter(
        (q) => (recencyCountMap.get(q.number) || 0) <= minPenalty + 1
      );
    }

    // 4. Pengacakan Kriptografis Sejati (Fisher-Yates Shuffle + CSPRNG crypto.randomBytes)
    const shuffledPool = [...candidatePool];
    for (let i = shuffledPool.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
    }

    // Pilih secara random dari kandidat yang sudah di-shuffle
    const selectedQ = shuffledPool[crypto.randomInt(0, shuffledPool.length)];
    const pickedNumber = selectedQ.number;

    return NextResponse.json({
      success: true,
      pickedNumber,
      modul: targetModul,
      totalAvailable: availableQuestions.length,
      question: selectedQ,
      metadata: {
        timestamp: new Date().toISOString(),
        npm: npm || "",
        kelompok: kelompok || "",
        modul: targetModul,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal melakukan spin soal",
      },
      { status: 500 }
    );
  }
}
