import { NextResponse } from "next/server";
import { connectToDatabase, localStore } from "@/lib/db";
import Question from "@/models/Question";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { number: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const modul = parseInt(searchParams.get("modul") || "1", 10);
    const qNum = parseInt(params.number, 10);

    if (isNaN(qNum) || qNum < 1) {
      return NextResponse.json(
        { success: false, error: "Nomor soal tidak valid" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    if (db) {
      const q = await Question.findOne({ modul, number: qNum }).lean();
      return NextResponse.json({ success: true, data: q || null });
    }

    const localQ = localStore.questions.get(`${modul}_${qNum}`) || null;

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
    if (isNaN(qNum) || qNum < 1) {
      return NextResponse.json(
        { success: false, error: "Nomor soal tidak valid" },
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

// DELETE: Hapus total soal ini dari modul
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
      await Question.deleteOne({ modul, number: qNum });
    }

    localStore.questions.delete(`${modul}_${qNum}`);

    return NextResponse.json({
      success: true,
      message: `Soal #${qNum} Modul ${modul} berhasil dihapus`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
