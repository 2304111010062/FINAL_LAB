import { NextResponse } from "next/server";
import { connectToDatabase, localStore } from "@/lib/db";
import ModuleConfig from "@/models/ModuleConfig";
import Question from "@/models/Question";
import Submission from "@/models/Submission";

export const dynamic = "force-dynamic";

const DEFAULT_MODULES = [
  { modul: 1, title: "I/O DEVICE" },
  { modul: 2, title: "7 SEGMENT" },
  { modul: 3, title: "ADDRESSING MODE" },
  { modul: 4, title: "JAM" },
  { modul: 5, title: "Modul 5" },
];

export async function GET() {
  try {
    const db = await connectToDatabase();

    if (db) {
      let configs = await ModuleConfig.find({}).sort({ modul: 1 }).lean();

      if (!configs || configs.length === 0) {
        await ModuleConfig.insertMany(DEFAULT_MODULES);
        configs = await ModuleConfig.find({}).sort({ modul: 1 }).lean();
      }

      return NextResponse.json({
        success: true,
        data: configs,
      });
    }

    // Local fallback
    const list: any[] = [];
    const sortedKeys = Array.from(localStore.modules.keys()).sort((a, b) => a - b);
    if (sortedKeys.length === 0) {
      DEFAULT_MODULES.forEach((dm) => localStore.modules.set(dm.modul, dm.title));
      sortedKeys.push(1, 2, 3, 4, 5);
    }

    sortedKeys.forEach((m) => {
      list.push({
        modul: m,
        title: localStore.modules.get(m) || `Modul ${m}`,
      });
    });

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat judul modul" },
      { status: 500 }
    );
  }
}

// POST: Tambah modul baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = (body.title || "").trim();

    const db = await connectToDatabase();

    let nextModulNum = 1;
    if (db) {
      const highest = await ModuleConfig.findOne({}).sort({ modul: -1 }).lean();
      if (highest) {
        nextModulNum = highest.modul + 1;
      }
      const newMod = await ModuleConfig.create({
        modul: nextModulNum,
        title: title || `Modul ${nextModulNum}`,
      });

      return NextResponse.json({
        success: true,
        message: `Modul ${nextModulNum} berhasil ditambahkan`,
        data: newMod,
      });
    }

    const keys = Array.from(localStore.modules.keys());
    if (keys.length > 0) {
      nextModulNum = Math.max(...keys) + 1;
    }
    localStore.modules.set(nextModulNum, title || `Modul ${nextModulNum}`);

    return NextResponse.json({
      success: true,
      message: `Modul ${nextModulNum} berhasil ditambahkan (local)`,
      data: { modul: nextModulNum, title: title || `Modul ${nextModulNum}` },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambah modul" },
      { status: 500 }
    );
  }
}

// PUT: Update judul modul yang ada
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { modules } = body; // Array of { modul: number, title: string }

    if (!Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data modul tidak valid" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    for (const item of modules) {
      const mNum = parseInt(item.modul, 10);
      const title = (item.title || "").trim();
      if (!isNaN(mNum) && mNum >= 1 && title.length > 0) {
        if (db) {
          await ModuleConfig.findOneAndUpdate(
            { modul: mNum },
            { modul: mNum, title },
            { upsert: true, new: true }
          );
        }
        localStore.modules.set(mNum, title);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Seluruh judul modul berhasil diperbarui",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan judul modul" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus modul
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const modul = parseInt(searchParams.get("modul") || "", 10);

    if (isNaN(modul) || modul < 1) {
      return NextResponse.json(
        { success: false, error: "Nomor modul tidak valid" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    if (db) {
      await ModuleConfig.deleteOne({ modul });
      await Question.deleteMany({ modul });
    }

    localStore.modules.delete(modul);
    Array.from(localStore.questions.keys()).forEach((key) => {
      if (key.startsWith(`${modul}_`)) {
        localStore.questions.delete(key);
      }
    });

    return NextResponse.json({
      success: true,
      message: `Modul ${modul} beserta soalnya berhasil dihapus`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus modul" },
      { status: 500 }
    );
  }
}
