import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase, localStore } from "@/lib/db";
import Question from "@/models/Question";
import { getInitialQuestionsForModul } from "@/lib/mockData";

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
    if (db) {
      availableQuestions = await Question.find({ modul: targetModul }).sort({ number: 1 }).lean();
      if ((!availableQuestions || availableQuestions.length === 0) && targetModul <= 5) {
        const initial = getInitialQuestionsForModul(targetModul);
        await Question.insertMany(initial);
        availableQuestions = await Question.find({ modul: targetModul }).sort({ number: 1 }).lean();
      }
    } else {
      if (targetModul <= 5) {
        const initialForModul = getInitialQuestionsForModul(targetModul);
        initialForModul.forEach((q) => {
          const key = `${targetModul}_${q.number}`;
          if (!localStore.questions.has(key)) {
            localStore.questions.set(key, { ...q, updatedAt: new Date() });
          }
        });
      }
      Array.from(localStore.questions.entries()).forEach(([key, val]) => {
        if (key.startsWith(`${targetModul}_`)) {
          availableQuestions.push(val);
        }
      });
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

    // Acak murni dari soal-soal yang ada (CSPRNG)
    const randomIndex = crypto.randomInt(0, availableQuestions.length);
    const selectedQ = availableQuestions[randomIndex];
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
    const fallbackNumber = Math.floor(Math.random() * 25) + 1;
    return NextResponse.json({
      success: true,
      pickedNumber: fallbackNumber,
      modul: 1,
      question: getInitialQuestionsForModul(1).find((q) => q.number === fallbackNumber),
    });
  }
}
