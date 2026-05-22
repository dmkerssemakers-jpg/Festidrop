import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import OpenAI from 'openai';
import { DEFAULT_DESIGN } from '@/lib/polaroid-design';
import type { PolaroidDesign } from '@/lib/polaroid-design';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Design config extraction prompt ──────────────────────────────────────────
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
  "labelTagline": ""
}

Rules:
- frameColor: the brand's dominant neutral/background color. Dark brand → dark frame (#111 range). Light brand → cream/white (#FFF range).
- labelBg: slightly lighter or same as frameColor. Must complement the photo.
- labelTextColor: high contrast with labelBg. Dark label → light text. Light label → dark text.
- labelStyle: "solid" for minimal/clean brands, "accent-line" for modern/bold brands, "gradient" for premium brands, "grain" for vintage/festival, "dots" for playful, "duotone" for editorial.
- noteFont: "caveat" for friendly/festival vibes, "uppercase" for premium/corporate.
- dateStampColor: use the brand's primary accent color.
- filterStrength: 0 for very clean/minimal brands, 40-70 for lifestyle brands, 85-100 for vintage/film aesthetic.
- watermarkOpacity: 10-25 (subtle), 25-40 (bold).
- watermarkColor: white if dark photo expected, black if very light expected.
- logoPosition: "center" if there's a clear logo, "hidden" if minimal.
- labelTagline: leave as empty string "".

Extract the exact hex colors visible in the brand materials. Be precise.
`.trim();

// ── Photo generation prompt ───────────────────────────────────────────────────
function buildPhotoPrompt(brandDescription: string, eventName: string): string {
  return `Create a vibrant, atmospheric festival/event photograph for a polaroid photo booth.
Brand context: ${brandDescription}
Event: ${eventName}

Requirements:
- Pure atmospheric scene — NO text, NO logos, NO people's faces visible
- Shot from within the crowd looking toward a stage or light installation
- Cinematic quality, slightly overexposed highlights
- Colors and mood must match the brand identity described
- Film grain texture, slight vignette
- Portrait orientation, festival/nightlife atmosphere
- The image will be placed inside a polaroid frame, so composition should work at 4:5 ratio`.trim();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY niet ingesteld' }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const files  = form.getAll('images') as File[];
    const eventName = (form.get('eventName') as string) || 'Festival';
    const generatePhoto = form.get('generatePhoto') === 'true';

    if (!files.length) {
      return NextResponse.json({ error: 'Geen afbeeldingen ontvangen' }, { status: 400 });
    }

    // ── Step 1: Analyse brand with GPT-4o vision ─────────────────────────────
    const imageContent: OpenAI.Chat.ChatCompletionContentPart[] = [];

    for (const file of files.slice(0, 4)) { // max 4 images
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mime   = file.type || 'image/jpeg';
      imageContent.push({
        type: 'image_url',
        image_url: { url: `data:${mime};base64,${base64}`, detail: 'high' },
      });
    }

    imageContent.push({ type: 'text', text: DESIGN_PROMPT });

    const analysisRes = await openai.chat.completions.create({
      model:      'gpt-4o',
      max_tokens: 800,
      messages:   [{ role: 'user', content: imageContent }],
    });

    const raw = analysisRes.choices[0].message.content?.trim() ?? '{}';

    // Strip possible markdown code fences
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let design: PolaroidDesign;
    try {
      const parsed = JSON.parse(cleaned);
      // Merge with defaults so we never get partial configs
      design = { ...DEFAULT_DESIGN, ...parsed, labelTagline: parsed.labelTagline ?? '' };
    } catch {
      design = { ...DEFAULT_DESIGN };
    }

    // ── Step 2: Extract brand description for photo prompt ───────────────────
    // Ask GPT-4o to describe the brand vibe in one sentence (cheap call)
    const descRes = await openai.chat.completions.create({
      model:      'gpt-4o',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: [
          ...imageContent.slice(0, imageContent.length - 1), // images only, no design prompt
          {
            type: 'text',
            text: 'Describe the visual style, color palette and mood of this brand in one sentence. Be specific about colors and atmosphere.',
          },
        ],
      }],
    });

    const brandDescription = descRes.choices[0].message.content?.trim() ?? 'vibrant festival brand';

    // ── Step 3 (optional): Generate atmosphere photo ─────────────────────────
    let photoBase64: string | null = null;

    if (generatePhoto) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgRes = await (openai.images.generate as any)({
        model:         'gpt-image-1',
        prompt:        buildPhotoPrompt(brandDescription, eventName),
        n:             1,
        size:          '1024x1536',
        quality:       'high',
        output_format: 'jpeg',
      });

      // gpt-image-1 returns b64_json
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      photoBase64 = (imgRes as any).data?.[0]?.b64_json ?? null;
    }

    return NextResponse.json({ design, photoBase64, brandDescription });

  } catch (err: unknown) {
    console.error('[brandbook-analyze]', err);
    const msg = err instanceof Error ? err.message : 'Onbekende fout';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const maxDuration = 60; // allow up to 60s for image generation
