import { NextRequest, NextResponse } from 'next/server';
import translate from 'google-translate-api-x';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const to = searchParams.get('to');
  const targetLang = to ? to.toLowerCase() : null;
  
  if (!text || !targetLang) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const options: any = { to: targetLang };
  options.from = "nl";
  if (targetLang === "fr") {
    options.forceTo = true;
  }

  try {
    const result = await translate(text, options);
    const res = NextResponse.json({ translation: result.text });
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    return res;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}