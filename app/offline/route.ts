import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const offlinePath = join(process.cwd(), "public", "offline.html");
    const html = readFileSync(offlinePath, "utf-8");
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#090d16;color:#f8fafc;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;text-align:center">
        <h1 style="font-size:2rem">You're offline</h1>
        <p style="color:#94a3b8">Please reconnect to access TransitOps.</p>
        <button onclick="window.location.reload()" style="padding:10px 24px;background:#0ea5e9;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer">Retry</button>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
}
