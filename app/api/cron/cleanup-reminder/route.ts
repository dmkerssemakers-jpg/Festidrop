import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM ?? 'FestiDrop <onboarding@resend.dev>';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now        = new Date();
  const cutoffFrom = new Date(now.getTime() - 25 * 86_400_000); // 25 days ago
  const cutoffTo   = new Date(now.getTime() - 24 * 86_400_000); // 24 days ago

  // Drops sent 24–25 days ago will expire in ~5 days
  const drops = await prisma.drop.findMany({
    where: { sentAt: { gte: cutoffFrom, lt: cutoffTo } },
    select: {
      email:   true,
      eventId: true,
      event:   { select: { name: true, slug: true, accentColor: true } },
    },
  });

  // One reminder per email+event pair
  const seen   = new Set<string>();
  const unique = drops.filter((d: typeof drops[number]) => {
    const key = `${d.email}:${d.eventId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://festidrop.vercel.app').replace(/\/$/, '');
  let sent = 0;
  const errors: string[] = [];

  for (const drop of unique) {
    const galleryUrl  = `${base}/gallery/${drop.event.slug}?email=${encodeURIComponent(drop.email)}`;
    const accentColor = drop.event.accentColor ?? '#1E8BFF';
    const eventName   = drop.event.name;

    const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7FBFF;font-family:Inter,ui-sans-serif,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7FBFF;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">

        <tr><td align="center" style="padding-bottom:28px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${accentColor};">
            ● ${eventName}
          </p>
          <h1 style="margin:0;font-size:30px;font-weight:900;color:#07162F;letter-spacing:-0.04em;line-height:1.1;">
            Je filmrol verdwijnt<br>
            <span style="color:${accentColor};">over 5 dagen</span>
          </h1>
          <p style="margin:12px 0 0;color:#6C7A8D;font-size:15px;line-height:1.6;">
            Download je foto's nu om ze permanent te bewaren.<br>
            Na 30 dagen worden ze automatisch verwijderd.
          </p>
        </td></tr>

        <tr><td align="center" style="padding:8px 0 24px;">
          <a href="${galleryUrl}"
            style="display:inline-block;background:${accentColor};color:#ffffff;
                   padding:16px 36px;border-radius:14px;text-decoration:none;
                   font-weight:800;font-size:15px;letter-spacing:-0.01em;">
            ⬇&nbsp; Download mijn foto's
          </a>
          <p style="margin:12px 0 0;font-size:11px;color:#A7B1C2;">
            Of bekijk je filmrol via bovenstaande link
          </p>
        </td></tr>

        <tr><td align="center" style="padding-top:8px;">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#A7B1C2;">
            Powered by FestiDrop
          </p>
          <p style="margin:6px 0 0;font-size:11px;color:#C5CDD8;line-height:1.6;">
            Je ontvangt deze herinnering omdat je eerder een FestiDrop hebt aangevraagd.<br>
            <a href="${base}/privacy" style="color:#A7B1C2;">Privacybeleid</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      const { error } = await resend.emails.send({
        from:    FROM,
        to:      drop.email,
        subject: `📸 ${eventName} — je filmrol verdwijnt over 5 dagen`,
        html,
      });
      if (error) errors.push(`${drop.email}: ${error.message}`);
      else sent++;
    } catch (err) {
      errors.push(`${drop.email}: ${String(err)}`);
    }
  }

  console.log(`[cleanup-reminder] found=${unique.length} sent=${sent} errors=${errors.length}`);
  return NextResponse.json({ found: unique.length, sent, errors });
}
