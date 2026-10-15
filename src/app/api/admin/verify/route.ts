import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const cleanPin = (pin || "").trim().toLowerCase();
    const masterPin = (process.env.ADMIN_PIN || "123456").trim().toLowerCase();

    let assignedModul: number | "all" = "all";

    if (cleanPin === "modul1") {
      assignedModul = 1;
    } else if (cleanPin === "modul2") {
      assignedModul = 2;
    } else if (cleanPin === "modul3") {
      assignedModul = 3;
    } else if (cleanPin === "modul4") {
      assignedModul = 4;
    } else if (cleanPin === "modul5") {
      assignedModul = 5;
    } else if (cleanPin === masterPin || cleanPin === "admin") {
      assignedModul = "all";
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Password salah. Masukkan password modul (modul1, modul2, modul3, modul4, modul5) atau password admin.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verifikasi berhasil",
      modul: assignedModul,
      token: "admin_token_" + Buffer.from(cleanPin).toString("base64"),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}
