// app/api/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";

// لا داعي لـ apiKey ثابت هنا، apiKey يمر مع كل طلب (من الحجز)
export async function POST(req: NextRequest) {
  const { phone, message, apiKey } = await req.json();
  if (!phone || !message || !apiKey) {
    return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
  }
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (text.includes("Message successfully sent")) {
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ ok: false, error: text }, { status: 500 });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
