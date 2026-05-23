import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import EventsList from '@/components/admin/EventsList';
import type { EventRow } from '@/components/admin/EventsList';

export const revalidate = 30;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://festidrop.vercel.app';

export default async function EventsPage() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [events, weeklyGroups] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { drops: true } },
        drops:  { orderBy: { sentAt: 'desc' }, take: 1, select: { sentAt: true } },
      },
    }),
    // Efficient: one aggregation query for weekly drops per event
    prisma.drop.groupBy({
      by:    ['eventId'],
      where: { sentAt: { gte: sevenDaysAgo } },
      _count: { id: true },
    }),
  ]);

  type WeeklyGroup = { eventId: string; _count: { id: number } };
  const weeklyMap = new Map(
    (weeklyGroups as WeeklyGroup[]).map(g => [g.eventId, g._count.id]),
  );

  // Serialize Date → ISO string so Next.js can pass to the client component
  type RawEvent = (typeof events)[number];
  const rows: EventRow[] = events.map((e: RawEvent) => ({
    id:            e.id,
    name:          e.name,
    slug:          e.slug,
    accentColor:   e.accentColor,
    isActive:      e.isActive,
    maxPhotos:     e.maxPhotos,
    accessCode:    e.accessCode,
    createdAt:     e.createdAt.toISOString(),
    endsAt:        e.endsAt?.toISOString() ?? null,
    totalDrops:    e._count.drops,
    dropsThisWeek: weeklyMap.get(e.id) ?? 0,
    lastDropAt:    e.drops[0]?.sentAt.toISOString() ?? null,
  }));

  const activeCount = rows.filter(e => e.isActive).length;
  const totalDrops  = rows.reduce((s, e) => s + e.totalDrops, 0);

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-black text-navy mb-1"
            style={{ letterSpacing: '-0.03em' }}
          >
            Events
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Chip label={`${rows.length} totaal`} color="rgba(7,22,47,0.08)"       text="#07162F" />
            <Chip label={`${activeCount} actief`}  color="rgba(0,200,150,0.12)"     text="#00A878" />
            <Chip label={`${totalDrops} drops`}    color="rgba(30,139,255,0.12)"    text="#1E8BFF" />
          </div>
        </div>

        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #1E8BFF, #20D6E8)',
            boxShadow:  '0 8px 24px rgba(30,139,255,0.28)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nieuw event
        </Link>
      </div>

      {/* ── List (handles empty / no-results / list states) ── */}
      <EventsList events={rows} baseUrl={BASE_URL} />
    </div>
  );
}

function Chip({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <span
      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: color, color: text }}
    >
      {label}
    </span>
  );
}
