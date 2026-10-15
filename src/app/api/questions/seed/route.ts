import { NextResponse } from "next/server";
import { connectToDatabase, localStore } from "@/lib/db";
import Question from "@/models/Question";
import { getInitialQuestionsForModul, ALL_INITIAL_QUESTIONS } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const modul = body.modul ? parseInt(body.modul, 10) : null;

    const db = await connectToDatabase();

    if (modul && modul >= 1 && modul <= 5) {
      // Seed specific modul
      const questionsForModul = getInitialQuestionsForModul(modul);

      if (db) {
        await Question.deleteMany({ modul });
        await Question.insertMany(questionsForModul);
      }

      questionsForModul.forEach((q) => {
        localStore.questions.set(`${modul}_${q.number}`, { ...q, updatedAt: new Date() });
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil push 25 bank soal untuk Modul ${modul}`,
        modul,
      });
    }

    // Seed all 5 modules if not specified
    if (db) {
      await Question.deleteMany({});
      await Question.insertMany(ALL_INITIAL_QUESTIONS);
    }

    ALL_INITIAL_QUESTIONS.forEach((q) => {
      localStore.questions.set(`${q.modul}_${q.number}`, { ...q, updatedAt: new Date() });
    });

    return NextResponse.json({
      success: true,
      message: "Berhasil memuat seluruh bank soal Modul 1 sampai 5 (125 soal)",
    });
  } catch (error: any) {
    console.error("Error seeding questions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal melakukan push soal" },
      { status: 500 }
    );
  }
}
