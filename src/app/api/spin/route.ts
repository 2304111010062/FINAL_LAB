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
    const targetModul = isNaN(modul) || modul < 1 || modul > 5 ? 1 : modul;

    // CSPRNG (Cryptographically Secure Pseudorandom Number Generator)
    const pickedNumber = crypto.randomInt(1, 26);

    let questionData = null;
    const db = await connectToDatabase();

    if (db) {
      questionData = await Question.findOne({ modul: targetModul, number: pickedNumber }).lean();
      if (!questionData) {
        const fallback = getInitialQuestionsForModul(targetModul).find((q) => q.number === pickedNumber);
        if (fallback) questionData = fallback;
      }
    } else {
      questionData =
        localStore.questions.get(`${targetModul}_${pickedNumber}`) ||
        getInitialQuestionsForModul(targetModul).find((q) => q.number === pickedNumber);
    }

    return NextResponse.json({
      success: true,
      pickedNumber,
      modul: targetModul,
      question: questionData || {
        modul: targetModul,
        number: pickedNumber,
        title: `Soal #${pickedNumber}`,
        htmlContent: `<p>Soal nomor ${pickedNumber} Modul ${targetModul} belum memiliki konten.</p>`,
        fontFamily: "Arial",
      },
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
