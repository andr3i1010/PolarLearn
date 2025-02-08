import { NextRequest, NextResponse } from 'next/server';
import translate from 'google-translate-api-x';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const to = searchParams.get('to');
  // Convert "to" to lowercase:
  const targetLang = to ? to.toLowerCase() : null;
  
  if (!text || !targetLang) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const options: any = { to: targetLang };
  if (targetLang === "fr") {
    options.forceTo = true;
  }
  // Add support for Dutch to English and Dutch to German
  if (targetLang === "en" || targetLang === "de") {
    options.from = "nl";
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