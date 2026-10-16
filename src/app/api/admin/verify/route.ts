import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Kredensial Tunggal Terpusat:
const REQUIRED_USER = "LahSismikTE24";
const REQUIRED_PASS = "FinalLabSismik@digital123";
const AUTH_SECRET = process.env.AUTH_SECRET || "sismik_secure_secret_key_2026_usk";

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim();
    const password = (body.password || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username dan Password wajib diisi." },
        { status: 400 }
      );
    }

    const isUserValid = safeCompare(username, REQUIRED_USER);
    const isPassValid = safeCompare(password, REQUIRED_PASS);

    if (!isUserValid || !isPassValid) {
      // Artificial delay 250ms to deter brute-force attacks
      await new Promise((r) => setTimeout(r, 250));
      return NextResponse.json(
        { success: false, error: "Username atau Password salah." },
        { status: 401 }
      );
    }

    // Buat token bertanda tangan HMAC (HMAC SHA-256)
    const timestamp = Date.now();
    const payload = `${username}:${timestamp}`;
    const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
    const secureToken = Buffer.from(`${payload}:${signature}`).toString("base64");

    return NextResponse.json({
      success: true,
      message: "Verifikasi berhasil. Akses penuh diberikan.",
      user: REQUIRED_USER,
      modul: "all",
      token: secureToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
