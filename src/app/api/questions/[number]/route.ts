import { NextResponse } from "next/server";
import { connectToDatabase, localStore } from "@/lib/db";
import Question from "@/models/Question";
import { getInitialQuestionsForModul } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { number: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const modul = parseInt(searchParams.get("modul") || "1", 10);
    const qNum = parseInt(params.number, 10);

    if (isNaN(qNum) || qNum < 1 || qNum > 25) {
      return NextResponse.json(
        { success: false, error: "Nomor soal tidak valid (1-25)" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    if (db) {
      let q = await Question.findOne({ modul, number: qNum }).lean();
      if (!q) {
        const initial = getInitialQuestionsForModul(modul).find((i) => i.number === qNum);
        if (initial) q = initial as any;
      }
      return NextResponse.json({ success: true, data: q });
    }

    const localQ =
      localStore.questions.get(`${modul}_${qNum}`) ||
      getInitialQuestionsForModul(modul).find((i) => i.number === qNum);

    return NextResponse.json({ success: true, data: localQ });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { number: string } }
) {
  try {
    const qNum = parseInt(params.number, 10);
    if (isNaN(qNum) || qNum < 1 || qNum > 25) {
      return NextResponse.json(
        { success: false, error: "Nomor soal tidak valid (1-25)" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const modul = parseInt(body.modul || "1", 10);
    const { title, htmlContent, fontFamily } = body;

    const db = await connectToDatabase();

    if (db) {
      const updated = await Question.findOneAndUpdate(
        { modul, number: qNum },
        {
          modul,
          number: qNum,
          title: title || `Soal #${qNum}`,
          htmlContent,
          fontFamily: fontFamily || "Arial",
        },
        { upsert: true, new: true, runValidators: true }
      );

      return NextResponse.json({
        success: true,
        message: `Soal #${qNum} Modul ${modul} berhasil diperbarui`,
        data: updated,
      });
    }

    const item = {
      modul,
      number: qNum,
      title: title || `Soal #${qNum}`,
      htmlContent,
      fontFamily: fontFamily || "Arial",
      updatedAt: new Date(),
    };
    localStore.questions.set(`${modul}_${qNum}`, item);

    return NextResponse.json({
      success: true,
      message: `Soal #${qNum} Modul ${modul} berhasil diperbarui (local)`,
      data: item,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus / reset isi soal dari card depan
export async function DELETE(
  req: Request,
  { params }: { params: { number: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const modul = parseInt(searchParams.get("modul") || "1", 10);
    const qNum = parseInt(params.number, 10);

    const db = await connectToDatabase();

    if (db) {
      await Question.findOneAndUpdate(
        { modul, number: qNum },
        {
          htmlContent: "<p>Konten soal belum diisi.</p>",
          title: `Soal #${qNum}`,
          fontFamily: "Arial",
        }
      );
    }

    localStore.questions.set(`${modul}_${qNum}`, {
      modul,
      number: qNum,
      title: `Soal #${qNum}`,
      htmlContent: "<p>Konten soal belum diisi.</p>",
      fontFamily: "Arial",
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Soal #${qNum} Modul ${modul} berhasil dikosongkan`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
