import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { kv } from '@vercel/kv';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? 'FestiDrop <onboarding@resend.dev>';

// Whitelisted e-mails die de limiet omzeilen (komma-gescheiden in env var)
const TEST_EMAILS = (process.env.TEST_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(req: NextRequest) {
  const { email, photos } = (await req.json()) as {
    email: string;
    photos: string[]; // base64 data-URLs: "data:image/jpeg;base64,..."
  };

  if (!email || !Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json(
      { error: 'email en foto\'s zijn verplicht' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isTestEmail = TEST_EMAILS.includes(normalizedEmail);
  const kvKey = `drop:${normalizedEmail}`;

  // ── Rate-limit check (alleen als KV geconfigureerd is) ───────────
  if (!isTestEmail) {
    try {
      const alreadyUsed = await kv.get(kvKey);
      if (alreadyUsed) {
        return NextResponse.json(
          { error: 'Dit e-mailadres heeft al een FestiDrop ontvangen. Tot de volgende editie! 🎉' },
          { status: 429 }
        );
      }
    } catch {
      // KV niet geconfigureerd of niet bereikbaar — sla limiet over
      console.warn('[send-drop] KV niet beschikbaar, rate-limit overgeslagen');
    }
  }

  // Strip data-URL header → raw base64
  const attachments = photos.map((dataUrl, i) => ({
    filename: `festidrop-${String(i + 1).padStart(2, '0')}.jpg`,
    content: dataUrl.replace(/^data:image\/\w+;base64,/, ''),
    contentType: 'image/jpeg' as const,
  }));

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7FBFF;font-family:Inter,ui-sans-serif,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7FBFF;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">

        <!-- Logo + header -->
        <tr><td align="center" style="padding-bottom:28px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6C7A8D;">
            ● Festival photo experience
          </p>
          <h1 style="margin:0;font-size:32px;font-weight:900;color:#07162F;letter-spacing:-0.04em;line-height:1.05;">
            Jouw FestiDrop<br>
            <span style="background:linear-gradient(90deg,#1E8BFF,#20D6E8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
              is er!
            </span>
          </h1>
          <p style="margin:12px 0 0;color:#6C7A8D;font-size:15px;line-height:1.6;">
            Je ${photos.length}&nbsp;polaroid-foto's zitten als bijlage bij deze mail.<br>
            Vang de sfeer. Deel de herinnering.
          </p>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:rgba(255,255,255,0.85);border:1px solid rgba(189,239,255,0.55);
                        border-radius:24px;padding:28px 24px;text-align:center;
                        box-shadow:0 24px 80px rgba(7,22,47,0.08);">
          <p style="margin:0 0 8px;font-size:15px;color:#07162F;font-weight:700;">
            📎 ${photos.length} foto's bijgevoegd
          </p>
          <p style="margin:0;font-size:13px;color:#6C7A8D;line-height:1.6;">
            Open de bijlagen om jouw festivalmomenten te bekijken.<br>
            Dit is de enige plek waar je ze kunt zien — bewaar ze goed!
          </p>
        </td></tr>

        <!-- Privacy note -->
        <tr><td align="center" style="padding-top:20px;">
          <p style="margin:0;font-size:11px;color:#A7B1C2;line-height:1.6;">
            We bewaren geen kopie van jouw foto's.<br>
            Je e-mailadres gebruiken we alleen voor deze drop.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Guard: API key must be present
  if (!process.env.RESEND_API_KEY) {
    console.error('[send-drop] RESEND_API_KEY is not set');
    return NextResponse.json({ error: 'Server configuratiefout (geen API key).' }, { status: 500 });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `📸 Jouw FestiDrop — ${photos.length} polaroids wachten op je`,
      html,
      attachments,
    });

    if (error) {
      console.error('[send-drop] Resend returned error:', error);
      return NextResponse.json({ error: `Resend: ${error.message}` }, { status: 500 });
    }

    // ── Registreer gebruik in KV (24 uur geldig) ─────────────────
    if (!isTestEmail) {
      try {
        await kv.set(kvKey, 1, { ex: 86400 });
      } catch {
        console.warn('[send-drop] KV write mislukt, gebruik niet opgeslagen');
      }
    }

    console.log('[send-drop] Sent OK, id:', data?.id, isTestEmail ? '(test email, geen limiet)' : '');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-drop] Unexpected error:', err);
    return NextResponse.json({ error: 'Verzenden mislukt. Probeer het opnieuw.' }, { status: 500 });
  }
}
