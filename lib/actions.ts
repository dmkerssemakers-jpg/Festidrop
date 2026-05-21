'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ── Slug helper ──────────────────────────────────────────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Create event ─────────────────────────────────────────────────────────────
export async function createEvent(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const customSlug = (formData.get('slug') as string | null)?.trim();
  const accentColor = (formData.get('accentColor') as string) || '#1E8BFF';
  const emailText = (formData.get('emailText') as string | null)?.trim() || null;
  const maxPhotos = parseInt(formData.get('maxPhotos') as string) || 10;

  const slug = customSlug || toSlug(name);

  const event = await prisma.event.create({
    data: { name, slug, accentColor, emailText, maxPhotos },
  });

  revalidatePath('/admin/events');
  redirect(`/admin/events/${event.id}`);
}

// ── Update event ─────────────────────────────────────────────────────────────
export async function updateEvent(id: string, formData: FormData) {
  const name       = (formData.get('name') as string).trim();
  const slug       = (formData.get('slug') as string).trim();
  const accentColor = (formData.get('accentColor') as string) || '#1E8BFF';
  const emailText  = (formData.get('emailText') as string | null)?.trim() || null;
  const maxPhotos  = parseInt(formData.get('maxPhotos') as string) || 10;
  const isActive   = formData.get('isActive') === 'true';
  const logoUrl    = (formData.get('logoUrl') as string | null)?.trim() || null;
  const accessCode = (formData.get('accessCode') as string | null)?.trim() || null;
  const endsAtRaw  = (formData.get('endsAt') as string | null)?.trim();
  const endsAt     = endsAtRaw ? new Date(endsAtRaw) : null;

  await prisma.event.update({
    where: { id },
    data: { name, slug, accentColor, emailText, maxPhotos, isActive, logoUrl, accessCode, endsAt },
  });

  revalidatePath(`/admin/events/${id}`);
  revalidatePath('/admin/events');
  revalidatePath('/admin');
}

// ── Duplicate event ───────────────────────────────────────────────────────────
export async function duplicateEvent(id: string) {
  const source = await prisma.event.findUnique({ where: { id } });
  if (!source) return;

  const baseSlug = `${source.slug}-copy`;
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${attempt++}`;
  }

  const copy = await prisma.event.create({
    data: {
      name:        `${source.name} (kopie)`,
      slug,
      accentColor: source.accentColor,
      logoUrl:     source.logoUrl,
      emailText:   source.emailText,
      maxPhotos:   source.maxPhotos,
      isActive:    false, // start inactive so you can review before publishing
      accessCode:  source.accessCode,
    },
  });

  revalidatePath('/admin/events');
  redirect(`/admin/events/${copy.id}`);
}

// ── Delete event ─────────────────────────────────────────────────────────────
export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
  revalidatePath('/admin/events');
  redirect('/admin/events');
}

// ── Whitelist ────────────────────────────────────────────────────────────────
export async function addWhitelist(eventId: string, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  await prisma.whitelist.upsert({
    where: { eventId_email: { eventId, email: normalized } },
    create: { eventId, email: normalized },
    update: {},
  });

  revalidatePath(`/admin/events/${eventId}`);
}

export async function removeWhitelist(id: string, eventId: string) {
  await prisma.whitelist.delete({ where: { id } });
  revalidatePath(`/admin/events/${eventId}`);
}
