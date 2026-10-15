import { NextResponse } from "next/server";
import { connectToDatabase, localStore } from "@/lib/db";
import ModuleConfig from "@/models/ModuleConfig";

export const dynamic = "force-dynamic";

const DEFAULT_MODULES = [
  { modul: 1, title: "GPIO & Register" },
  { modul: 2, title: "Timer & Counter" },
  { modul: 3, title: "Interupsi & ADC" },
  { modul: 4, title: "Komunikasi Serial" },
  { modul: 5, title: "PWM & Kontrol Motor" },
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
    const list = [1, 2, 3, 4, 5].map((m) => ({
      modul: m,
      title: localStore.modules.get(m) || `Modul ${m}`,
    }));

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
      if (!isNaN(mNum) && mNum >= 1 && mNum <= 5 && title.length > 0) {
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
