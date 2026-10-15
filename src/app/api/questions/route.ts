import { NextResponse } from "next/server";
import { connectToDatabase, localStore } from "@/lib/db";
import Question from "@/models/Question";
import { getInitialQuestionsForModul } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const modul = parseInt(searchParams.get("modul") || "1", 10);
    const targetModul = isNaN(modul) || modul < 1 ? 1 : modul;

    const db = await connectToDatabase();

    if (db) {
      let questions = await Question.find({ modul: targetModul }).sort({ number: 1 }).lean();

      // If module 1-5 has no questions yet, auto-seed with 25 initial questions
      if ((!questions || questions.length === 0) && targetModul <= 5) {
        const initial = getInitialQuestionsForModul(targetModul);
        await Question.insertMany(initial);
        questions = await Question.find({ modul: targetModul }).sort({ number: 1 }).lean();
      }

      return NextResponse.json({
        success: true,
        source: "mongodb-atlas",
        modul: targetModul,
        total: (questions || []).length,
        data: questions || [],
      });
    }

    // Local in-memory fallback
    if (targetModul <= 5) {
      const initialForModul = getInitialQuestionsForModul(targetModul);
      initialForModul.forEach((q) => {
        const key = `${targetModul}_${q.number}`;
        if (!localStore.questions.has(key)) {
          localStore.questions.set(key, { ...q, updatedAt: new Date() });
        }
      });
    }

    const fallbackList: any[] = [];
    Array.from(localStore.questions.entries()).forEach(([key, val]) => {
      if (key.startsWith(`${targetModul}_`)) {
        fallbackList.push(val);
      }
    });
    fallbackList.sort((a, b) => a.number - b.number);

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

// POST: Tambah soal baru di modul (nomor otomatis atau ditentukan)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { modul, number, title, htmlContent, fontFamily } = body;
    const modulNum = parseInt(modul || "1", 10);

    const db = await connectToDatabase();

    let targetNumber = parseInt(number, 10);
    if (isNaN(targetNumber) || targetNumber < 1) {
      // Cari nomor tertinggi di modul ini, lalu tambah 1
      if (db) {
        const highest = await Question.findOne({ modul: modulNum }).sort({ number: -1 }).lean();
        targetNumber = highest ? highest.number + 1 : 1;
      } else {
        let maxNum = 0;
        Array.from(localStore.questions.entries()).forEach(([k, v]) => {
          if (k.startsWith(`${modulNum}_`)) {
            if (v.number > maxNum) maxNum = v.number;
          }
        });
        targetNumber = maxNum + 1;
      }
    }

    if (db) {
      const updated = await Question.findOneAndUpdate(
        { modul: modulNum, number: targetNumber },
        {
          modul: modulNum,
          number: targetNumber,
          title: title || `Soal #${targetNumber}`,
          htmlContent: htmlContent || "<p>Ketik soal di sini...</p>",
          fontFamily: fontFamily || "Arial",
        },
        { upsert: true, new: true, runValidators: true }
      );

      return NextResponse.json({
        success: true,
        message: `Soal #${targetNumber} Modul ${modulNum} berhasil disimpan`,
        data: updated,
      });
    }

    const item = {
      modul: modulNum,
      number: targetNumber,
      title: title || `Soal #${targetNumber}`,
      htmlContent: htmlContent || "<p>Ketik soal di sini...</p>",
      fontFamily: fontFamily || "Arial",
      updatedAt: new Date(),
    };
    localStore.questions.set(`${modulNum}_${targetNumber}`, item);

    return NextResponse.json({
      success: true,
      message: `Soal #${targetNumber} Modul ${modulNum} berhasil disimpan (local)`,
      data: item,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan soal" },
      { status: 500 }
    );
  }
}
