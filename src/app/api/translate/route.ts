import { NextRequest, NextResponse } from 'next/server';
import translate from 'google-translate-api-x';

// Mapping from internal language codes to ISO 639-1 codes for Google Translate
const languageCodeMap: Record<string, string> = {
  'NL': 'nl', // Dutch
  'EN': 'en', // English
  'FR': 'fr', // French
  'DE': 'de', // German
  'GR': 'el', // Greek
  'LA': 'la', // Latin
};

// Function to convert internal language code to ISO code
function getISOLanguageCode(internalCode: string): string {
  const upperCode = internalCode.toUpperCase();
  return languageCodeMap[upperCode] || internalCode.toLowerCase();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const to = searchParams.get('to');
  const from = searchParams.get('from');
  const targetLang = to ? getISOLanguageCode(to) : null;
  const sourceLang = from ? getISOLanguageCode(from) : 'nl';

  if (!text || !targetLang) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const options: any = { to: targetLang };
  options.from = sourceLang;
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