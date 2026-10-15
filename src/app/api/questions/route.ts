import { NextResponse } from "next/server";
import { connectToDatabase, localStore } from "@/lib/db";
import Question from "@/models/Question";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const modul = parseInt(searchParams.get("modul") || "1", 10);
    const targetModul = isNaN(modul) || modul < 1 ? 1 : modul;

    const db = await connectToDatabase();

    if (db) {
      const questions = await Question.find({ modul: targetModul }).sort({ number: 1 }).lean();

      return NextResponse.json({
        success: true,
        source: "mongodb-atlas",
        modul: targetModul,
        total: (questions || []).length,
        data: questions || [],
      });
    }

    // Local in-memory fallback
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

// DELETE: Hapus semua soal di modul atau multiple selected soal
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const modul = parseInt(searchParams.get("modul") || "1", 10);
    const clearAll = searchParams.get("clearAll") === "true";

    let numbers: number[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body.numbers)) {
        numbers = body.numbers.map((n: any) => parseInt(n, 10)).filter((n: number) => !isNaN(n));
      }
    } catch {
      // no body
    }

    const db = await connectToDatabase();

    if (clearAll) {
      if (db) {
        await Question.deleteMany({ modul });
      }
      Array.from(localStore.questions.keys()).forEach((k) => {
        if (k.startsWith(`${modul}_`)) {
          localStore.questions.delete(k);
        }
      });
      return NextResponse.json({
        success: true,
        message: `Semua soal di Modul ${modul} berhasil dihapus`,
      });
    }

    if (numbers.length > 0) {
      if (db) {
        await Question.deleteMany({ modul, number: { $in: numbers } });
      }
      numbers.forEach((num) => {
        localStore.questions.delete(`${modul}_${num}`);
      });
      return NextResponse.json({
        success: true,
        message: `${numbers.length} soal berhasil dihapus`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Tentukan soal yang ingin dihapus" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus soal" },
      { status: 500 }
    );
  }
}
