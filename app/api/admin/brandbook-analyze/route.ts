import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DEFAULT_DESIGN } from '@/lib/polaroid-design';
import type { PolaroidDesign } from '@/lib/polaroid-design';

const DESIGN_PROMPT = `
You are a professional brand designer. Analyze the uploaded brand identity image(s) and return a JSON object for a polaroid photo booth design.

Return ONLY valid JSON — no markdown, no explanation — matching exactly this shape:
{
  "frameColor": "#hex",
  "labelBg": "#hex",
  "labelTextColor": "#hex",
  "labelStyle": "solid" | "accent-line" | "gradient" | "duotone" | "dots" | "grain",
  "noteFont": "caveat" | "uppercase",
  "dateStamp": true | false,
  "dateStampColor": "#hex",
  "dateStampPosition": "left" | "right",
  "watermark": true | false,
  "watermarkOpacity": 10-40,
  "watermarkColor": "#hex",
  "filterStrength": 0-100,
  "logoPosition": "center" | "bottom" | "hidden",
  "labelTagline": "",
  "brandDescription": "one sentence describing the brand vibe and colors"
}

Rules:
- frameColor: dominant neutral/background from the brand. Dark brand → dark (#111 range). Light brand → cream/white (#FFF range).
- labelBg: complement frameColor. Usually same or slightly lighter.
- labelTextColor: must contrast with labelBg. Dark bg → light text. Light bg → dark text.
- labelStyle: "solid" for minimal/clean, "accent-line" for modern/bold, "gradient" for premium, "grain" for vintage/festival, "dots" for playful, "duotone" for editorial.
- noteFont: "caveat" for friendly/festival, "uppercase" for premium/corporate.
- dateStampColor: the brand's primary accent/highlight color (exact hex from the image).
- filterStrength: 0 for clean/minimal brands, 40-70 for lifestyle, 85-100 for vintage/film aesthetic.
- watermarkOpacity: 10-25 subtle, 25-40 bold.
- watermarkColor: "#FFFFFF" if dark photo expected, "#000000" if very light.
- logoPosition: "center" if strong logo present, "hidden" for minimal brands.
- labelTagline: always empty string "".
- brandDescription: one sentence with specific colors and mood.

Extract exact hex colors visible in the brand materials. Be precise.
`.trim();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY niet ingesteld in Vercel Environment Variables' }, { status: 500 });
  }

  try {
    const form  = await req.formData();
    const files = form.getAll('images') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'Geen afbeeldingen ontvangen' }, { status: 400 });
    }

    // ── Build image parts for Gemini ─────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const imageParts = await Promise.all(
      files.slice(0, 4).map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return {
          inlineData: {
            data:     base64,
            mimeType: file.type || 'image/jpeg',
          },
        };
      })
    );

    // ── Call Gemini (with retry on 503) ─────────────────────────────────────
    let result;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await model.generateContent([...imageParts, DESIGN_PROMPT]);
        break;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '';
        if (attempt < 3 && (msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand'))) {
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        throw e;
      }
    }
    const raw = result!.response.text().trim();

    // Strip possible markdown code fences
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let design: PolaroidDesign;
    let brandDescription = '';

    try {
      const parsed = JSON.parse(cleaned);
      brandDescription = parsed.brandDescription ?? '';
      // Merge with defaults — never return a partial config
      design = { ...DEFAULT_DESIGN, ...parsed, labelTagline: '' };
    } catch {
      design = { ...DEFAULT_DESIGN };
    }

    return NextResponse.json({ design, brandDescription });

  } catch (err: unknown) {
    console.error('[brandbook-analyze]', err);
    const msg = err instanceof Error ? err.message : 'Onbekende fout';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const maxDuration = 30;
