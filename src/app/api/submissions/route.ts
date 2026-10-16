import { NextResponse } from "next/server";
import { connectToDatabase, localStore } from "@/lib/db";
import Submission from "@/models/Submission";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const modul = searchParams.get("modul");
    const kelompok = searchParams.get("kelompok");
    const search = searchParams.get("search");

    const db = await connectToDatabase();

    if (db) {
      const query: any = {};
      if (modul && modul !== "all") {
        query.modul = parseInt(modul, 10);
      }
      if (kelompok && kelompok !== "all") {
        query.kelompok = kelompok;
      }
      if (search && search.trim() !== "") {
        query.npm = { $regex: search.trim(), $options: "i" };
      }

      const submissions = await Submission.find(query).sort({ createdAt: -1 }).lean();

      const total = submissions.length;
      let avgScore = 0;
      let maxScore = 0;
      let minScore = 0;

      if (total > 0) {
        const sum = submissions.reduce((acc, curr) => acc + (curr.score || 0), 0);
        avgScore = Math.round((sum / total) * 10) / 10;
        maxScore = Math.max(...submissions.map((s) => s.score || 0));
        minScore = Math.min(...submissions.map((s) => s.score || 0));
      }

      return NextResponse.json({
        success: true,
        source: "mongodb-atlas",
        total,
        stats: {
          totalStudents: total,
          targetCapacity: 500, // 500 mahasiswa capacity
          avgScore,
          maxScore,
          minScore,
        },
        data: submissions,
      });
    }

    // Local in-memory fallback
    let list = [...localStore.submissions];
    if (modul && modul !== "all") {
      const mNum = parseInt(modul, 10);
      list = list.filter((s) => s.modul === mNum);
    }
    if (kelompok && kelompok !== "all") {
      list = list.filter((s) => s.kelompok === kelompok);
    }
    if (search && search.trim() !== "") {
      const term = search.trim().toLowerCase();
      list = list.filter((s) => s.npm.toLowerCase().includes(term));
    }

    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = list.length;
    let avgScore = 0;
    let maxScore = 0;
    let minScore = 0;

    if (total > 0) {
      const sum = list.reduce((acc, curr) => acc + (curr.score || 0), 0);
      avgScore = Math.round((sum / total) * 10) / 10;
      maxScore = Math.max(...list.map((s) => s.score || 0));
      minScore = Math.min(...list.map((s) => s.score || 0));
    }

    return NextResponse.json({
      success: true,
      source: "local-fallback",
      total,
      stats: {
        totalStudents: total,
        targetCapacity: 500, // 500 mahasiswa capacity
        avgScore,
        maxScore,
        minScore,
      },
      data: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat rekap nilai" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      modul,
      npm,
      kelompok,
      questionNumber,
      questionSnapshot,
      score,
      notes,
      evaluator,
    } = body;

    if (!npm || npm.trim() === "") {
      return NextResponse.json({ success: false, error: "NPM wajib diisi" }, { status: 400 });
    }

    if (!kelompok || kelompok.trim() === "") {
      return NextResponse.json({ success: false, error: "Kelompok wajib dipilih" }, { status: 400 });
    }

    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return NextResponse.json(
        { success: false, error: "Nilai harus berupa angka 0 - 100" },
        { status: 400 }
      );
    }

    const submissionData = {
      modul: parseInt(modul || "1", 10),
      npm: npm.trim().toUpperCase(),
      kelompok: kelompok.trim(),
      questionNumber: Number(questionNumber),
      questionSnapshot: questionSnapshot || "",
      score: numericScore,
      notes: notes ? notes.trim() : "",
      evaluator: evaluator ? evaluator.trim() : "Dosen / Asisten",
      createdAt: new Date(),
    };

    const db = await connectToDatabase();

    if (db) {
      const created = await Submission.create(submissionData);
      return NextResponse.json({
        success: true,
        message: `Nilai ${submissionData.npm} berhasil disimpan`,
        data: created,
      });
    }

    const localEntry = {
      _id: "local_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      ...submissionData,
      updatedAt: new Date(),
    };
    localStore.submissions.unshift(localEntry);

    return NextResponse.json({
      success: true,
      message: `Nilai ${submissionData.npm} berhasil disimpan (local)`,
      data: localEntry,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan nilai" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, modul, npm, kelompok, questionNumber, score, notes, evaluator } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID submission wajib ada" }, { status: 400 });
    }

    if (!npm || npm.trim() === "") {
      return NextResponse.json({ success: false, error: "NPM wajib diisi" }, { status: 400 });
    }

    if (!kelompok || kelompok.trim() === "") {
      return NextResponse.json({ success: false, error: "Kelompok wajib diisi" }, { status: 400 });
    }

    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return NextResponse.json(
        { success: false, error: "Nilai harus berupa angka 0 - 100" },
        { status: 400 }
      );
    }

    const updatePayload: any = {
      npm: npm.trim().toUpperCase(),
      kelompok: kelompok.trim(),
      score: numericScore,
      notes: notes !== undefined ? notes.trim() : "",
      evaluator: evaluator !== undefined ? evaluator.trim() : "Dosen / Asisten",
    };

    if (modul !== undefined) {
      updatePayload.modul = parseInt(modul, 10);
    }
    if (questionNumber !== undefined && questionNumber !== "") {
      updatePayload.questionNumber = Number(questionNumber);
    }

    const db = await connectToDatabase();

    if (db) {
      const updated = await Submission.findByIdAndUpdate(
        id,
        { $set: updatePayload },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return NextResponse.json({ success: false, error: "Data mahasiswa tidak ditemukan" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Data mahasiswa ${updated.npm} berhasil diperbarui`,
        data: updated,
      });
    }

    // Local fallback
    const idx = localStore.submissions.findIndex((s) => s._id?.toString() === id);
    if (idx !== -1) {
      localStore.submissions[idx] = {
        ...localStore.submissions[idx],
        ...updatePayload,
        updatedAt: new Date(),
      };
      return NextResponse.json({
        success: true,
        message: `Data mahasiswa ${updatePayload.npm} berhasil diperbarui (local)`,
        data: localStore.submissions[idx],
      });
    }

    return NextResponse.json({ success: false, error: "Data tidak ditemukan di local storage" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui data" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll");

    const db = await connectToDatabase();

    if (clearAll === "true") {
      if (db) await Submission.deleteMany({});
      localStore.submissions = [];
      return NextResponse.json({ success: true, message: "Rekap nilai berhasil dikosongkan" });
    }

    if (id) {
      if (db) {
        await Submission.findByIdAndDelete(id);
      } else {
        localStore.submissions = localStore.submissions.filter((s) => s._id?.toString() !== id);
      }
      return NextResponse.json({ success: true, message: "Data berhasil dihapus" });
    }

    return NextResponse.json({ success: false, error: "ID diperlukan" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
