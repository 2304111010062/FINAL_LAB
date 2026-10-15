import { NextResponse } from "next/server";
import { connectToDatabase, localStore } from "@/lib/db";
import Question from "@/models/Question";
import { getInitialQuestionsForModul } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const modul = parseInt(searchParams.get("modul") || "1", 10);
    const targetModul = isNaN(modul) || modul < 1 || modul > 5 ? 1 : modul;

    const db = await connectToDatabase();

    if (db) {
      let questions = await Question.find({ modul: targetModul }).sort({ number: 1 }).lean();

      // If this module has no questions yet, auto-seed with 25 questions
      if (!questions || questions.length === 0) {
        const initial = getInitialQuestionsForModul(targetModul);
        await Question.insertMany(initial);
        questions = await Question.find({ modul: targetModul }).sort({ number: 1 }).lean();
      }

      return NextResponse.json({
        success: true,
        source: "mongodb-atlas",
        modul: targetModul,
        total: questions.length,
        data: questions,
      });
    }

    // Local in-memory fallback
    const initialForModul = getInitialQuestionsForModul(targetModul);
    initialForModul.forEach((q) => {
      const key = `${targetModul}_${q.number}`;
      if (!localStore.questions.has(key)) {
        localStore.questions.set(key, { ...q, updatedAt: new Date() });
      }
    });

    const fallbackList: any[] = [];
    for (let i = 1; i <= 25; i++) {
      const item = localStore.questions.get(`${targetModul}_${i}`);
      if (item) fallbackList.push(item);
    }

    return NextResponse.json({
      success: true,
      source: "local-fallback",
      modul: targetModul,
      total: fallbackList.length,
      data: fallbackList,
    });
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat soal" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { modul, number, title, htmlContent, fontFamily } = body;
    const modulNum = parseInt(modul || "1", 10);
    const qNum = parseInt(number, 10);

    if (isNaN(qNum) || qNum < 1 || qNum > 25) {
      return NextResponse.json(
        { success: false, error: "Nomor soal harus antara 1 sampai 25" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    if (db) {
      const updated = await Question.findOneAndUpdate(
        { modul: modulNum, number: qNum },
        {
          modul: modulNum,
          number: qNum,
          title: title || `Soal #${qNum}`,
          htmlContent: htmlContent || "",
          fontFamily: fontFamily || "Arial",
        },
        { upsert: true, new: true, runValidators: true }
      );

      return NextResponse.json({
        success: true,
        message: `Soal #${qNum} Modul ${modulNum} berhasil disimpan`,
        data: updated,
      });
    }

    const item = {
      modul: modulNum,
      number: qNum,
      title: title || `Soal #${qNum}`,
      htmlContent: htmlContent || "",
      fontFamily: fontFamily || "Arial",
      updatedAt: new Date(),
    };
    localStore.questions.set(`${modulNum}_${qNum}`, item);

    return NextResponse.json({
      success: true,
      message: `Soal #${qNum} Modul ${modulNum} berhasil disimpan (local)`,
      data: item,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan soal" },
      { status: 500 }
    );
  }
}
