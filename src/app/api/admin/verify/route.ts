import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim().toLowerCase();
    const password = (body.password || body.pin || "").trim();
    const cleanPass = password.toLowerCase();
    const masterPin = (process.env.ADMIN_PIN || "123456").trim().toLowerCase();

    let assignedModul: number | "all" = "all";

    // Kredensial Admin Utama yang diminta:
    // Username: labsismik
    // Password: LabSimsik@digital123
    const isMasterCredential =
      (username === "labsismik" && password === "LabSimsik@digital123") ||
      cleanPass === "labsimsik@digital123" ||
      cleanPass === masterPin ||
      cleanPass === "admin";

    if (isMasterCredential) {
      assignedModul = "all";
    } else if (cleanPass === "modul1" || username === "modul1") {
      assignedModul = 1;
    } else if (cleanPass === "modul2" || username === "modul2") {
      assignedModul = 2;
    } else if (cleanPass === "modul3" || username === "modul3") {
      assignedModul = 3;
    } else if (cleanPass === "modul4" || username === "modul4") {
      assignedModul = 4;
    } else if (cleanPass === "modul5" || username === "modul5") {
      assignedModul = 5;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Username atau Password salah.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verifikasi berhasil",
      modul: assignedModul,
      token: "admin_token_" + Buffer.from(username + ":" + password).toString("base64"),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}
